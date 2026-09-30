import express from "express";
import { authMiddleware, requireAdmin } from "../middlewares/auth.js";
import supabase from "../supabase.js";
import Groq from "groq-sdk";

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.use(authMiddleware);

// =====================================================
// HELPER FUNCTIONS FOR ORGANIZATION MATCHING
// =====================================================

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Related capability terms.
const expertiseAliases = {
  "civil structural engineers": [
    "civil engineering",
    "structural engineering",
    "civil",
    "structural",
    "construction engineering",
    "construction"
  ],
  "road maintenance contractors": [
    "road maintenance",
    "road construction",
    "highway engineering",
    "infrastructure",
    "construction",
    "epc"
  ],
  "gis remote sensing specialists": [
    "gis",
    "remote sensing",
    "geospatial",
    "geoinformatics",
    "surveying",
    "mapping"
  ],
  "traffic safety officers": [
    "traffic engineering",
    "transportation engineering",
    "traffic safety",
    "road safety",
    "transportation"
  ],
  // --------------------------------
  // STREET LIGHTING
  // --------------------------------
  "electrical engineering": [
    "electrical engineering",
    "electrical and electronics engineering",
    "electrical electronics engineering",
    "electrical infrastructure",
    "electrical systems",
    "power systems",
    "power engineering",
    "lighting systems",
    "smart lighting",
    "street lighting",
    "led lighting",
    "iot",
    "embedded systems",
    "energy management"
  ],
  "electrical electronics engineering": [
    "electrical engineering",
    "electrical and electronics engineering",
    "electrical infrastructure",
    "electrical systems",
    "power systems",
    "power engineering",
    "lighting systems",
    "smart lighting",
    "street lighting",
    "iot",
    "embedded systems"
  ],
  "electrical and electronics engineering": [
    "electrical engineering",
    "electrical electronics engineering",
    "electrical infrastructure",
    "electrical systems",
    "power systems",
    "lighting systems",
    "smart lighting",
    "street lighting",
    "iot",
    "embedded systems"
  ],
  "lighting systems": [
    "street lighting",
    "smart lighting",
    "led lighting",
    "outdoor lighting",
    "electrical engineering",
    "electrical infrastructure",
    "iot",
    "energy management"
  ],
  "smart lighting": [
    "street lighting",
    "lighting systems",
    "led lighting",
    "outdoor lighting",
    "electrical engineering",
    "iot",
    "energy management"
  ],
  "street lighting": [
    "street lighting",
    "smart lighting",
    "lighting systems",
    "led lighting",
    "outdoor lighting",
    "electrical engineering",
    "electrical infrastructure",
    "electrical systems",
    "iot",
    "embedded systems",
    "smart infrastructure",
    "energy management"
  ],
  "iot": [
    "iot",
    "internet of things",
    "embedded systems",
    "smart infrastructure",
    "smart lighting",
    "lighting systems",
    "electrical systems"
  ],
  // --------------------------------
  // ILLEGAL CONSTRUCTION
  // --------------------------------
  "illegal construction": [
    "civil engineering",
    "structural engineering",
    "architecture",
    "urban planning",
    "construction",
    "building infrastructure",
    "building safety",
    "structural safety"
  ],
  // --------------------------------
  // ANIMAL WELFARE
  // --------------------------------
  "animal welfare": [
    "veterinary medicine",
    "veterinary science",
    "animal health",
    "animal sciences",
    "animal science",
    "animal husbandry",
    "animal welfare",
    "veterinary response"
  ]
};

const domainAliases = {
  "road infrastructure maintenance": [
    "road infrastructure",
    "road maintenance",
    "civil engineering",
    "infrastructure",
    "urban infrastructure",
    "transportation",
    "transportation engineering",
    "highway engineering",
  ],
  "water management": [
    "water",
    "water management",
    "water infrastructure",
    "water supply",
    "wastewater",
    "drainage",
    "environment",
  ],
  "waste management": [
    "waste",
    "waste management",
    "solid waste",
    "garbage",
    "recycling",
    "circular economy",
    "environment",
  ],
  "environment": [
    "environment",
    "environmental engineering",
    "sustainability",
    "waste management",
    "water management",
    "circular economy",
  ],
  "urban infrastructure": [
    "urban infrastructure",
    "infrastructure",
    "civil engineering",
    "construction",
    "smart city",
    "transportation",
  ],
  "street lighting": [
    "electrical engineering",
    "electrical infrastructure",
    "lighting systems",
    "smart lighting",
    "iot",
    "embedded systems",
    "energy management"
  ],
  "illegal construction": [
    "civil engineering",
    "structural engineering",
    "architecture",
    "urban planning",
    "construction",
    "building infrastructure"
  ],
  "animal welfare": [
    "veterinary medicine",
    "veterinary science",
    "animal health",
    "animal sciences",
    "animal husbandry",
    "animal welfare"
  ]
};

function expertiseMatches(required, available) {
  const requiredNormalized = normalize(required);
  const availableNormalized = normalize(available);

  if (!requiredNormalized || !availableNormalized) {
    return false;
  }

  // --------------------------------
  // Direct match
  // --------------------------------
  if (
    availableNormalized.includes(requiredNormalized) ||
    requiredNormalized.includes(availableNormalized)
  ) {
    return true;
  }

  // --------------------------------
  // Required -> available aliases
  // --------------------------------
  const requiredAliases = expertiseAliases[requiredNormalized] || [];

  if (
    requiredAliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      return (
        availableNormalized.includes(normalizedAlias) ||
        normalizedAlias.includes(availableNormalized)
      );
    })
  ) {
    return true;
  }

  // --------------------------------
  // Available -> required aliases
  // --------------------------------
  const availableAliases = expertiseAliases[availableNormalized] || [];

  if (
    availableAliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      return (
        requiredNormalized.includes(normalizedAlias) ||
        normalizedAlias.includes(requiredNormalized)
      );
    })
  ) {
    return true;
  }

  return false;
}

function domainMatches(requiredDomain, availableDomain) {
  const required = normalize(requiredDomain);
  const available = normalize(availableDomain);

  if (!required || !available) {
    return false;
  }

  // Direct match
  if (available.includes(required) || required.includes(available)) {
    return true;
  }

  // Required domain aliases
  const requiredAliases = domainAliases[required] || [];

  if (
    requiredAliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      return (
        available.includes(normalizedAlias) ||
        normalizedAlias.includes(available)
      );
    })
  ) {
    return true;
  }

  return false;
}

function toArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalize(item)).filter(Boolean);
}

// =====================================================
// CALCULATE ORGANIZATION MATCH
// =====================================================

function calculateMatch(analysis, organization) {
  const originalRequiredExpertise = Array.isArray(analysis.required_expertise)
    ? analysis.required_expertise
    : [];

  const requiredExpertise = originalRequiredExpertise.map((item) =>
    normalize(item)
  );

  const details =
    organization.role === "university"
      ? organization.university_details || {}
      : organization.industry_details || {};

  const expertise = toArray(details.expertise);
  const domains = toArray(details.interestedDomains || details.civic_domains);
  const resources = toArray(details.resourcesOffered || details.facilities);
  const requiredDomain = normalize(analysis.domain);

  // --------------------------------
  // 1. Expertise match
  // --------------------------------
  const matchedExpertise = [];

  for (const required of requiredExpertise) {
    for (const available of expertise) {
      if (expertiseMatches(required, available)) {
        matchedExpertise.push(
          originalRequiredExpertise[requiredExpertise.indexOf(required)]
        );
        break;
      }
    }
  }

  const expertiseScore =
    requiredExpertise.length > 0
      ? matchedExpertise.length / requiredExpertise.length
      : 0;

  // --------------------------------
  // 2. Civic domain match
  // --------------------------------
  let domainScore = 0;

  if (requiredDomain) {
    domainScore = domains.some((domain) =>
      domainMatches(requiredDomain, domain)
    )
      ? 1
      : 0;
  }

  // --------------------------------
  // 3. Resource match
  // --------------------------------
  let resourceMatches = 0;

  for (const required of requiredExpertise) {
    for (const resource of resources) {
      if (resource.includes(required) || required.includes(resource)) {
        resourceMatches++;
        break;
      }
    }
  }

  const resourceScore =
    requiredExpertise.length > 0
      ? Math.min(resourceMatches / requiredExpertise.length, 1)
      : 0;

  // --------------------------------
  // Final weighted score
  // --------------------------------
  const finalScore =
    expertiseScore * 0.70 + domainScore * 0.20 + resourceScore * 0.10;

  const score = Math.round(finalScore * 100);

  return {
    score,
    matchedExpertise: [...new Set(matchedExpertise)],
    expertiseScore,
    domainScore,
    resourceScore,
    details,
  };
}

// =====================================================
// CREATE NEW CIVIC COMPLAINT
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      state,
      city,
      street,
      ward_area,
      domain,
      priority,
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required.",
      });
    }

    // 1. Fetch current user status
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("nova_coins, strikes, is_banned")
      .eq("id", userId)
      .single();

    if (userErr) {
      console.error("Error fetching user:", userErr);
      return res.status(500).json({ message: "Could not verify user status." });
    }

    if (user?.is_banned) {
      return res.status(403).json({ isBanned: true, message: "Your account is suspended." });
    }

    // 2. Check for duplicate/spam issues (using street and title)
    if (street) {
      const { data: duplicates } = await supabase
        .from("issues")
        .select("id")
        .eq("street", street)
        .ilike("title", `%${title}%`);

      if (duplicates && duplicates.length > 0) {
        // 3. Issue a Strike
        const newStrikes = (user?.strikes || 0) + 1;
        const isBanned = newStrikes >= 3;

        await supabase
          .from("users")
          .update({ strikes: newStrikes, is_banned: isBanned })
          .eq("id", userId);

        return res.status(400).json({
          strikes: newStrikes,
          isBanned: isBanned,
          message: isBanned
            ? "Account permanently banned due to 3 duplicate/false reports."
            : `Duplicate report detected at this location. Strike ${newStrikes} of 3.`
        });
      }
    }

    // 4. Create the valid issue
    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        title,
        description,
        state: state || null,
        city: city || null,
        street: street || null,
        ward_area: ward_area || null,
        submitted_by: userId,
        submitter_role: userRole,
        domain: domain || null,
        priority: priority || "Medium",
        status: "Submitted",
        required_expertise: [],
        solution_idea: null,
        analyzed: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Create issue error:", error);
      return res.status(500).json({
        message: "Could not submit complaint.",
      });
    }

    // 5. Reward Nova Coins
    const newCoins = (user?.nova_coins || 0) + 10;
    await supabase
      .from("users")
      .update({ nova_coins: newCoins })
      .eq("id", userId);

    return res.status(201).json({
      message: "Complaint submitted successfully.",
      issue,
      new_coins: newCoins
    });

  } catch (error) {
    console.error("Create issue error:", error);
    return res.status(500).json({
      message: "Something went wrong while submitting the complaint.",
    });
  }
});

// =====================================================
// ANALYZE COMPLAINT USING AI
// =====================================================

router.post("/:id/analyze", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------
    // 1. Get complaint
    // --------------------------------
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    // --------------------------------
    // 2. Decide relevant historical categories
    // --------------------------------
    const categoryMap = {
      water: ["Water Supply Disruption", "Water Leakage / Pipe Burst"],
      drainage: ["Drainage Overflow / Flooding"],
      waste: ["Solid Waste / Garbage"],
      road: ["Pothole / Road Damage"],
      street: ["Street Light Failure"],
      construction: ["Illegal Construction", "Encroachment"],
      tree: ["Tree Fallen / Dangerous Tree"],
      pollution: ["Noise / Air Pollution"],
      animal: ["Stray Animal Menace"],
      health: ["Health / Epidemic"],
      toilet: ["Public Toilet Condition"],
    };

    const text = `
      ${issue.title || ""}
      ${issue.description || ""}
      ${issue.domain || ""}
    `.toLowerCase();

    let categories = [];

    for (const [keyword, values] of Object.entries(categoryMap)) {
      if (text.includes(keyword)) {
        categories.push(...values);
      }
    }

    // Fallback
    if (categories.length === 0) {
      categories = [
        "Water Supply Disruption",
        "Water Leakage / Pipe Burst",
        "Drainage Overflow / Flooding",
        "Solid Waste / Garbage",
        "Pothole / Road Damage",
      ];
    }

    categories = [...new Set(categories)];

    // --------------------------------
    // 3. Historical evidence
    // --------------------------------
    const { data: historicalEvidence, error: historyError } = await supabase.rpc(
      "get_historical_evidence",
      {
        p_categories: categories,
        p_ward_area: issue.ward_area || null,
        p_limit: 10,
      }
    );

    const { data: locationStatistics, error: locationStatsError } = await supabase.rpc(
      "get_location_statistics"
    );

    if (locationStatsError) {
      console.error("Location statistics error:", locationStatsError);
    }

    const { data: categoryStatistics, error: categoryStatsError } = await supabase.rpc(
      "get_category_statistics"
    );

    if (categoryStatsError) {
      console.error("Category statistics error:", categoryStatsError);
    }

    if (historyError) {
      console.error("Historical evidence error:", historyError);
      return res.status(500).json({
        message: "Could not retrieve historical evidence.",
      });
    }

    // --------------------------------
    // 4. Prepare evidence
    // --------------------------------
    const compactLocationStatistics = (locationStatistics || []).slice(0, 10);
    const compactCategoryStatistics = (categoryStatistics || []).slice(0, 15);
    const evidence = (historicalEvidence || []).map((item) => ({
      category: item.complaint_category,
      ward: item.ward_area,
      severity: item.severity,
      status: item.complaint_status,
      resolution_days: item.resolution_days,
      reassignments: item.num_reassignments,
      work_quality: item.work_quality_rating,
      inspected: item.site_inspected,
      infrastructure_age: item.infrastructure_age_years,
      maintenance_gap_months: item.months_since_last_maintained,
      citizen_satisfied: item.citizen_satisfied,
    }));

    // --------------------------------
    // 5. AI prompt
    // --------------------------------
    const prompt = `
You are Nagrik Nova's evidence-based civic problem analysis AI.

Analyze the following NEW CITIZEN COMPLAINT.

COMPLAINT:
Title: ${issue.title}
Description: ${issue.description}
State: ${issue.state || "Not provided"}
City: ${issue.city || "Not provided"}
Street: ${issue.street || "Not provided"}
Ward: ${issue.ward_area || "Not provided"}
Domain: ${issue.domain || "Not provided"}
Priority currently assigned: ${issue.priority}

Location-level intelligence:
${JSON.stringify(compactLocationStatistics)}

Category-level intelligence:
${JSON.stringify(compactCategoryStatistics)}

Detailed historical evidence:
${JSON.stringify(evidence)}

IMPORTANT RULES:
1. Analyze the actual complaint, not merely its category.
2. Historical evidence represents past observations. It does NOT prove that the same root cause exists in this new complaint.
3. Clearly distinguish:
- what the citizen reported
- what can be reasonably inferred
- what requires field verification
4. Do not invent facts, measurements, organizations, infrastructure conditions, or causes.
5. Use historical evidence only when it is relevant.
6. If the evidence is insufficient, say so.
7. Root cause must include both:
- likely root cause
- reasoning
8. Suggest practical actions that an authority could actually take.
9. Identify the expertise/resources that may be required to investigate or solve the problem.
10. Give a confidence level based on the available evidence.

Return ONLY valid JSON in exactly this structure:
{
  "actual_problem": "",
  "domain": "",
  "urgency": "",
  "root_cause": "",
  "root_cause_reasoning": "",
  "impacts": [],
  "required_expertise": [],
  "recommended_actions": [],
  "preventive_measures": [],
  "technology_data_requirements": [],
  "possible_organizations": [],
  "practical_solution": "",
  "confidence": 0,
  "evidence_summary": [],
  "verification_required": true,
  "verification_notes": ""
}

For evidence_summary:
describe historical observations that are relevant to this complaint.
Do NOT present historical observations as proof of causation.
Use the location-level and category-level intelligence as aggregate historical context.
Use detailed historical evidence as supporting evidence.
Historical data describes patterns in the available dataset.
It does not prove causation or prove that the same conditions currently exist.
Do not claim that a historical correlation is a confirmed root cause.

Clearly distinguish:
- documented historical pattern
- reasonable inference
- hypothesis
- verification required

If the evidence is insufficient to determine a root cause, say so and recommend what should be verified.
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are Nagrik Nova's evidence-based civic problem analysis AI. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 1200,
      reasoning_effort: "low",
      include_reasoning: false,
      response_format: {
        type: "json_object",
      },
    });

    // --------------------------------
    // 6. Parse AI response
    // --------------------------------
    const aiText = completion.choices?.[0]?.message?.content;

    if (!aiText) {
      return res.status(500).json({
        message: "AI did not return an analysis.",
      });
    }

    let analysis;
    try {
      analysis = JSON.parse(aiText);
    } catch (parseError) {
      console.error("AI JSON parse error:", parseError);
      console.error("AI response:", aiText);
      return res.status(500).json({
        message: "AI returned an invalid analysis.",
      });
    }

    // --------------------------------
    // 7. Save AI analysis
    // --------------------------------
    const { data: savedAnalysis, error: analysisError } = await supabase
      .from("issue_ai_analysis")
      .upsert(
        {
          issue_id: id,
          actual_problem: analysis.actual_problem || null,
          domain: analysis.domain || null,
          urgency: analysis.urgency || null,
          root_cause: analysis.root_cause || null,
          root_cause_reasoning: analysis.root_cause_reasoning || null,
          impacts: analysis.impacts || [],
          required_expertise: analysis.required_expertise || [],
          recommended_actions: analysis.recommended_actions || [],
          preventive_measures: analysis.preventive_measures || [],
          technology_data_requirements: analysis.technology_data_requirements || [],
          possible_organizations: analysis.possible_organizations || [],
          practical_solution: analysis.practical_solution || null,
          confidence: typeof analysis.confidence === "number" ? analysis.confidence : null,
          evidence_summary: analysis.evidence_summary || [],
          historical_evidence: evidence,
          verification_required: analysis.verification_required ?? true,
          verification_notes: analysis.verification_notes || null,
          model_name: "openai/gpt-oss-120b",
        },
        {
          onConflict: "issue_id",
        }
      )
      .select()
      .single();

    if (analysisError) {
      console.error("Save AI analysis error:", analysisError);
      return res.status(500).json({
        message: "AI analysis was generated but could not be saved.",
      });
    }

    // --------------------------------
    // 8. Convert urgency to priority
    // --------------------------------
    const urgency = String(analysis.urgency || "").toLowerCase();
    let mappedPriority = issue.priority || "Medium";

    if (
      urgency.includes("high") ||
      urgency.includes("critical") ||
      urgency.includes("urgent")
    ) {
      mappedPriority = "High";
    } else if (urgency.includes("low")) {
      mappedPriority = "Low";
    } else if (urgency.includes("medium") || urgency.includes("moderate")) {
      mappedPriority = "Medium";
    }

    // --------------------------------
    // 9. Update issue
    // --------------------------------
    const { data: updatedIssue, error: updateError } = await supabase
      .from("issues")
      .update({
        domain: analysis.domain || issue.domain,
        priority: mappedPriority,
        required_expertise: analysis.required_expertise || [],
        solution_idea: analysis.practical_solution || null,
        analyzed: true,
        analyzed_by: req.user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update issue after AI error:", updateError);
      return res.status(500).json({
        message: "Analysis saved, but complaint could not be updated.",
      });
    }

    return res.json({
      message: "Complaint analyzed successfully.",
      issue: updatedIssue,
      analysis: savedAnalysis,
      historicalEvidenceCount: evidence.length,
    });
  } catch (error) {
    console.error("Analyze issue error:", error);
    return res.status(500).json({
      message: "Something went wrong while analyzing the complaint.",
    });
  }
});

// =====================================================
// MATCH ORGANIZATIONS
// =====================================================

router.post("/:id/match-organizations", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------
    // Get issue
    // --------------------------------
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({
        message: "Issue not found.",
      });
    }

    // --------------------------------
    // Get AI analysis
    // --------------------------------
    const { data: analysis, error: analysisError } = await supabase
      .from("issue_ai_analysis")
      .select("*")
      .eq("issue_id", id)
      .single();

    if (analysisError || !analysis) {
      return res.status(400).json({
        message: "Please analyze the issue before matching organizations.",
      });
    }

    // --------------------------------
    // Get universities + industries
    // --------------------------------
    const { data: organizations, error: organizationError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        address,
        university_details,
        industry_details
      `)
      .in("role", ["university", "industry"]);

    if (organizationError) {
      console.error("Organization fetch error:", organizationError);
      return res.status(500).json({
        message: "Could not load organizations.",
      });
    }

    // --------------------------------
    // Calculate matches
    // --------------------------------
    const matches = organizations
      .map((organization) => {
        const result = calculateMatch(analysis, organization);

        return {
          issue_id: id,
          organization_user_id: organization.id,
          organization_name: organization.name,
          organization_role: organization.role,
          matched_expertise: result.matchedExpertise,
          match_score: result.score,
          match_reason:
            result.score > 70
              ? "Strong capability match for the requirements identified by the AI analysis."
              : result.score > 40
              ? "Partial capability match for the requirements identified by the AI analysis."
              : "Limited capability overlap with the requirements identified by the AI analysis.",
        };
      })
      .filter((match) => match.match_score > 20)
      .sort((a, b) => b.match_score - a.match_score);

    // --------------------------------
    // Remove old suggestions
    // --------------------------------
    const { error: deleteError } = await supabase
      .from("issue_matches")
      .delete()
      .eq("issue_id", id);

    if (deleteError) {
      console.error("Old match deletion error:", deleteError);
    }

    // --------------------------------
    // Save new matches
    // --------------------------------
    if (matches.length > 0) {
      const rowsToInsert = matches.map((match) => ({
        issue_id: match.issue_id,
        organization_user_id: match.organization_user_id,
        matched_expertise: match.matched_expertise,
        match_reason: match.match_reason,
        match_score: match.match_score,
        status: "Suggested",
      }));

      const { error: insertError } = await supabase
        .from("issue_matches")
        .insert(rowsToInsert);

      if (insertError) {
        console.error("Match insert error:", insertError);
        return res.status(500).json({
          message: "Could not save organization matches.",
        });
      }
    }

    // --------------------------------
    // Return top matches
    // --------------------------------
    return res.json({
      message: "Organizations matched successfully.",
      totalMatches: matches.length,
      matches: matches.slice(0, 10),
    });
  } catch (error) {
    console.error("Organization matching error:", error);
    return res.status(500).json({
      message: "Could not match organizations.",
    });
  }
});

// =====================================================
// GET ALL COMPLAINTS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("issues")
      .select(`
        *,
        submitted_user:users!issues_submitted_by_fkey(
          id,
          name,
          email,
          role
        )
      `)
      .order("submitted_at", {
        ascending: false,
      });

    if (error) {
      console.error("Get issues error:", error);
      return res.status(500).json({
        message: "Could not fetch complaints.",
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Get issues error:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching complaints.",
    });
  }
});

// =====================================================
// GET SINGLE COMPLAINT
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------
    // 1. Get issue
    // --------------------------------
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", id)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({
        message: "Issue not found.",
      });
    }

    // --------------------------------
    // 2. Get saved AI analysis
    // --------------------------------
    const { data: analysis, error: analysisError } = await supabase
      .from("issue_ai_analysis")
      .select("*")
      .eq("issue_id", id)
      .maybeSingle();

    if (analysisError) {
      console.error("AI analysis fetch error:", analysisError);
    }

    // --------------------------------
    // 3. Get organization matches
    // --------------------------------
    const { data: matches, error: matchesError } = await supabase
      .from("issue_matches")
      .select(`
        id,
        organization_user_id,
        matched_expertise,
        match_reason,
        match_score,
        status,
        users:organization_user_id (
          id,
          name,
          email,
          role,
          address,
          university_details,
          industry_details
        )
      `)
      .eq("issue_id", id)
      .order("match_score", {
        ascending: false,
      });

    if (matchesError) {
      console.error("Organization matches fetch error:", matchesError);
    }

    // --------------------------------
    // 4. Return everything
    // --------------------------------
    return res.json({
      issue,
      aiAnalysis: analysis || null,
      matches: matches || [],
    });
  } catch (error) {
    console.error("Get issue error:", error);
    return res.status(500).json({
      message: "Could not load this issue.",
    });
  }
});

// =====================================================
// UPDATE COMPLAINT STATUS
// =====================================================

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;
    const updates = {};

    if (status) {
      updates.status = status;
    }

    if (priority) {
      updates.priority = priority;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No update data provided.",
      });
    }

    const { data: issue, error } = await supabase
      .from("issues")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update issue error:", error);
      return res.status(500).json({
        message: "Could not update complaint.",
      });
    }

    return res.json({
      message: "Complaint updated successfully.",
      issue,
    });
  } catch (error) {
    console.error("Update issue error:", error);
    return res.status(500).json({
      message: "Something went wrong while updating complaint.",
    });
  }
});

export default router;