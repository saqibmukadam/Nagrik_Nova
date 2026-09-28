import express from "express";
import supabase from "../supabase.js";
import Groq from "groq-sdk";

const router = express.Router();

// Initialize Groq using your environment variable
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// =====================================================
// 1. SMART SCANNER (GROQ VISION)
// =====================================================

router.post("/scan", async (req, res) => {
  try {
    // Grab the pre-compressed base64 string straight from your React frontend
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: "No image data provided." });
    }

    const prompt = `Analyze this image of a civic infrastructure issue. 
    Respond STRICTLY with a valid JSON object in this exact format:
    {
      "title": "A short, specific title (e.g., Deep Pothole on Main Road)",
      "description": "A 2-3 sentence detailed description of the visible hazard and its potential impact."
    }`;

    // Call Groq's active multimodal vision model (Qwen)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      // Using the active Qwen 2.5 Vision model
      model: "qwen-2.5-vl-7b-instruct",
      temperature: 0.1,
      response_format: { type: "json_object" }, 
    });

    const responseText = chatCompletion.choices[0].message.content;
    const parsedData = JSON.parse(responseText);

    res.status(200).json({
      title: parsedData.title,
      description: parsedData.description,
    });
  } catch (error) {
    console.error("Backend Groq Vision Error:", error);
    res.status(500).json({ message: "Failed to analyze image with Groq AI." });
  }
});


// =====================================================
// 2. NOVA AI CHAT
// =====================================================

router.post("/chat", async (req, res) => {
  try {
    const { message, history, userId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Please enter a message.",
      });
    }

    // =================================================
    // 1. GET RECENT ACTIVE COMPLAINTS
    // =================================================

    const { data: activeIssues, error: issuesError } = await supabase
      .from("issues")
      .select(`
        id,
        title,
        description,
        state,
        city,
        street,
        ward_area,
        domain,
        priority,
        status,
        submitted_at
      `)
      .not("status", "in", "(Resolved,Closed)")
      .order("submitted_at", {
        ascending: false,
      })
      .limit(5);

    if (issuesError) {
      console.error("Nova active issues error:", issuesError);
    }

    // =================================================
    // 2. PREPARE DATABASE CONTEXT
    // =================================================

    const dbContext =
      activeIssues && activeIssues.length > 0
        ? activeIssues.map((issue) => ({
            title: issue.title,
            description: issue.description,
            city: issue.city,
            state: issue.state,
            domain: issue.domain,
            priority: issue.priority,
            status: issue.status,
          }))
        : [];

    const dbContextString =
      dbContext.length > 0
        ? JSON.stringify(dbContext)
        : "No active complaints found.";

    // =================================================
    // 3. PREPARE CONVERSATION HISTORY
    // =================================================

    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];

    const historyTranscript =
      safeHistory.length > 0
        ? safeHistory
            .map((item) => {
              const speaker = item.role === "user" ? "Citizen" : "Nova";
              return `${speaker}: ${item.text || ""}`;
            })
            .join("\n")
        : "No previous conversation.";

    // =================================================
    // 4. NOVA PROMPT
    // =================================================

    const prompt = `
You are Nova, the nationwide civic AI assistant for Nagrik Nova.

Nagrik Nova helps citizens report civic problems across India.

Your job is to have a natural conversation with the citizen and help collect enough information to create a civic complaint.

The citizen may report problems involving:
- roads
- potholes
- water supply
- drainage
- flooding
- garbage
- street lights
- illegal construction
- pollution
- public toilets
- trees
- stray animals
- public infrastructure
- other civic issues

You must understand the citizen's conversation rather than asking for every field separately.

--------------------------------------------------
CONVERSATION HISTORY
--------------------------------------------------

${historyTranscript}

--------------------------------------------------
CURRENT ACTIVE COMPLAINTS
--------------------------------------------------

${dbContextString}

--------------------------------------------------
LATEST CITIZEN MESSAGE
--------------------------------------------------

Citizen: "${message}"

--------------------------------------------------
WHAT YOU MUST EXTRACT
--------------------------------------------------

Try to determine:

1. description
   What civic problem is being reported?

2. category
   The main category of the problem.

3. location
   The location mentioned by the citizen.
   This can be a city, area, street, landmark, ward, etc.

4. severity
   Use:
   1 = Low
   2 = Medium
   3 = High

5. title
   Create a short title of approximately 3-6 words.

--------------------------------------------------
CONVERSATION BEHAVIOR
--------------------------------------------------

If important information is missing, ask the citizen naturally for it.

Do NOT repeatedly ask for information that has already been provided.

For example:

Citizen:
"There is a huge pothole near Hinjewadi bridge."

You should understand:
- description = pothole
- location = Hinjewadi bridge
- category = Road / Pothole

If the information is sufficient to create a complaint, mark the status as:

"final_report"

If important information is still missing, use:

"processing"

The minimum information required before creating a complaint is:
- a meaningful description
- a usable location

Do not invent a location.

If severity is not explicitly stated, estimate it from the described situation.

--------------------------------------------------
EXISTING COMPLAINTS
--------------------------------------------------

The database context contains existing active complaints.

Use it only as supporting context.

If the citizen appears to be reporting the same problem as an existing complaint, you may mention that a similar complaint may already exist.

Do NOT claim that two complaints are duplicates unless the evidence is clear.

--------------------------------------------------
OUTPUT
--------------------------------------------------

Return ONLY valid JSON.

Use exactly this structure:

{
  "message": "",
  "dataToSave": {
    "description": "",
    "category": "",
    "location": "",
    "severity": 1,
    "title": ""
  },
  "status": "processing"
}

The status must be either:

"processing"

or

"final_report"

If the complaint is ready to save, use "final_report".

If more information is required, use "processing".
`;

    // =================================================
    // 5. CALL GROQ
    // =================================================

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are Nova, Nagrik Nova's civic AI assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 700,
      reasoning_effort: "low",
      include_reasoning: false,
      response_format: {
        type: "json_object",
      },
    });

    // =================================================
    // 6. READ AI RESPONSE
    // =================================================

    const aiText = completion.choices?.[0]?.message?.content;

    if (!aiText) {
      return res.status(500).json({
        message: "Nova did not return a response.",
      });
    }

    let aiResult;

    try {
      aiResult = JSON.parse(aiText);
    } catch (parseError) {
      console.error("Nova JSON parse error:", parseError);
      console.error("Nova response:", aiText);

      return res.status(500).json({
        message: "Nova returned an invalid response.",
      });
    }

    // =================================================
    // 7. VALIDATE AI DATA
    // =================================================

    const dataToSave = aiResult.dataToSave || {};

    const description = String(dataToSave.description || "").trim();
    const location = String(dataToSave.location || "").trim();
    const category = String(dataToSave.category || "").trim();
    const title = String(dataToSave.title || "Civic Issue").trim();
    let severity = Number(dataToSave.severity);

    if (![1, 2, 3].includes(severity)) {
      severity = 1;
    }

    // =================================================
    // 8. IF NOT READY → CONTINUE CONVERSATION
    // =================================================

    if (
      aiResult.status !== "final_report" ||
      !description ||
      !location
    ) {
      return res.json({
        message:
          aiResult.message ||
          "Could you provide a little more information about the issue and its location?",
        status: "processing",
      });
    }

    // =================================================
    // 9. MAP SEVERITY TO NAGRIK NOVA PRIORITY
    // =================================================

    let priority = "Low";

    if (severity === 3) {
      priority = "High";
    } else if (severity === 2) {
      priority = "Medium";
    }

    // =================================================
    // 10. CREATE COMPLAINT
    // =================================================

    const { data: issue, error: insertError } = await supabase
      .from("issues")
      .insert({
        title,
        description,
        city: location,
        submitted_by: userId || null,
        submitter_role: userId ? "citizen" : "citizen",
        domain: category || null,
        priority,
        status: "Submitted",
        required_expertise: [],
        solution_idea: null,
        analyzed: false,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Nova complaint insert error:", insertError);
      return res.status(500).json({
        message: "I understood the complaint, but I could not save it right now.",
      });
    }

    // =================================================
    // 11. FINAL RESPONSE
    // =================================================

    return res.json({
      message: aiResult.message || "Your complaint has been submitted successfully.",
      status: "final_report",
      issue,
    });
  } catch (error) {
    console.error("Nova AI chat error:", error);
    return res.status(500).json({
      message: "Sorry, Nova is temporarily unavailable. Please try again.",
    });
  }
});

export default router;