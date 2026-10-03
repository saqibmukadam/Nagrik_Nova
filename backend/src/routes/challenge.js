import express from "express";
import supabase from "../supabase.js";
import { authMiddleware, requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| GET ALL CHALLENGES
|--------------------------------------------------------------------------
| Admin:
|   - sees all challenges
|   - sees ALL assigned organizations
|
| Organization:
|   - sees challenges assigned to that organization
|   - gets its OWN assignment status
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Challenges fetch error:", error);

      return res.status(500).json({
        message: "Could not load challenges.",
      });
    }

    if (!challenges?.length) {
      return res.json([]);
    }

    const issueIds = challenges.map(
      (challenge) => challenge.issue_id
    );

    /*
     * Get EVERY assignment for these challenges.
     *
     * Important:
     * We intentionally do NOT reduce this to one assignment.
     */
    const { data: matches, error: matchesError } =
      await supabase
        .from("issue_matches")
        .select(`
          id,
          issue_id,
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
        .in("issue_id", issueIds)
        .in("status", [
          "Assigned",
          "Accepted",
          "In Progress",
          "Completed",
          "Rejected",
        ])
        .order("match_score", {
          ascending: false,
        });

    if (matchesError) {
      console.error(
        "Challenge assignments fetch error:",
        matchesError
      );
    }

    const result = challenges.map((challenge) => {
      /*
       * All assignment records for this challenge.
       */
      const challengeMatches =
        matches?.filter(
          (match) =>
            match.issue_id === challenge.issue_id
        ) || [];

      /*
       * Rejected assignments are kept in matches,
       * but are not considered active assignments.
       */
      const assignments =
        challengeMatches.filter(
          (match) =>
            match.status !== "Rejected"
        );

      /*
       * The currently logged-in user's assignment.
       *
       * This is extremely important for organization dashboards.
       */
      const myAssignment =
        assignments.find(
          (match) =>
            match.organization_user_id ===
            req.user.id
        ) || null;

      /*
       * Keep the old fields too for compatibility
       * with any existing frontend code.
       *
       * "assignment" is now only a legacy/first assignment.
       */
      const firstAssignment =
        assignments[0] || null;

      return {
        ...challenge,

        /*
         * NEW:
         * Every assigned organization.
         */
        assignments,

        /*
         * NEW:
         * Assignment belonging to current logged-in user.
         */
        my_assignment: myAssignment,

        /*
         * NEW:
         * Current user's status.
         */
        my_assignment_status:
          myAssignment?.status || null,

        /*
         * OLD compatibility fields.
         */
        assignment: firstAssignment,

        assignment_status:
          firstAssignment?.status ||
          "Not Assigned",

        assigned_organization:
          firstAssignment?.users ||
          null,

        /*
         * All matches, including rejected.
         */
        matches: challengeMatches,
      };
    });

    return res.json(result);
  } catch (err) {
    console.error(
      "GET /challenges error:",
      err
    );

    return res.status(500).json({
      message: "Could not load challenges.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET SINGLE CHALLENGE
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: challenge, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !challenge) {
      return res.status(404).json({
        message: "Challenge not found.",
      });
    }

    const { data: matches, error: matchesError } =
      await supabase
        .from("issue_matches")
        .select(`
          id,
          issue_id,
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
        .eq("issue_id", challenge.issue_id)
        .order("match_score", {
          ascending: false,
        });

    if (matchesError) {
      console.error(
        "Single challenge assignments error:",
        matchesError
      );
    }

    const allMatches = matches || [];

    const assignments =
      allMatches.filter(
        (match) =>
          match.status !== "Rejected"
      );

    const myAssignment =
      assignments.find(
        (match) =>
          match.organization_user_id ===
          req.user.id
      ) || null;

    return res.json({
      challenge,

      /*
       * Every organization assigned to this challenge.
       */
      assignments,

      /*
       * Current user's assignment.
       */
      my_assignment: myAssignment,

      my_assignment_status:
        myAssignment?.status || null,

      /*
       * Keep all matches for admin/details pages.
       */
      matches: allMatches,
    });
  } catch (error) {
    console.error(
      "GET single challenge error:",
      error
    );

    return res.status(500).json({
      message: "Could not load challenge.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| GENERATE CHALLENGE FROM AI ANALYSIS
|--------------------------------------------------------------------------
*/
router.post("/from-issue/:issueId", requireAdmin, async (req, res) => {
  try {
    const { issueId } = req.params;

    // Get complaint
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({
        message: "Issue not found.",
      });
    }

    if (!issue.analyzed) {
      return res.status(400).json({
        message: "Analyze the complaint before generating a challenge.",
      });
    }

    // Check whether challenge already exists
    const { data: existingChallenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("issue_id", issueId)
      .maybeSingle();

    if (existingChallenge) {
      return res.json({
        challenge: existingChallenge,
        alreadyExists: true,
      });
    }

    // Get saved AI analysis
    const { data: analysis, error: analysisError } = await supabase
      .from("issue_ai_analysis")
      .select("*")
      .eq("issue_id", issueId)
      .maybeSingle();

    if (analysisError || !analysis) {
      return res.status(400).json({
        message: "AI analysis is not available for this complaint.",
      });
    }

    /*
    ----------------------------------------------------------------------
    Generate challenge using Groq
    ----------------------------------------------------------------------
    */

    const prompt = `
You are generating a practical civic problem-solving challenge.

Use ONLY the complaint and its existing AI analysis below.

Do not invent organizations, statistics, causes, or facts.

Complaint:
Title: ${issue.title}
Description: ${issue.description}
Location: ${issue.street || ""}, ${issue.city || ""}, ${issue.state || ""}
Domain: ${issue.domain || ""}
Priority: ${issue.priority || ""}

AI Analysis:
Actual Problem:
${analysis.actual_problem || ""}

Root Cause:
${analysis.root_cause || ""}

Root Cause Reasoning:
${analysis.root_cause_reasoning || ""}

Impacts:
${JSON.stringify(analysis.impacts || [])}

Required Expertise:
${JSON.stringify(analysis.required_expertise || [])}

Recommended Actions:
${JSON.stringify(analysis.recommended_actions || [])}

Technology/Data Requirements:
${JSON.stringify(analysis.technology_data_requirements || [])}

Practical Solution:
${analysis.practical_solution || ""}

Create a challenge that a university or industry could realistically work on.

Return ONLY valid JSON:

{
  "title": "",
  "problem_statement": "",
  "description": "",
  "expected_outcome": "",
  "required_expertise": [],
  "resources": [],
  "suggested_technology": [],
  "expected_deliverable": ""
}

Rules:
- Make the challenge specific to the reported civic problem.
- Do not turn it into a generic AI project.
- Required expertise should reflect the existing AI analysis.
- Suggested technology should be practical.
- Expected deliverable must be something a university or industry could actually produce.
- Do not claim that a solution is guaranteed.
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You generate structured civic innovation challenges. Return JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Groq error:", errorText);

      return res.status(500).json({
        message: "Challenge generation failed.",
      });
    }

    const result = await response.json();

    const generated = JSON.parse(
      result.choices?.[0]?.message?.content || "{}"
    );

    /*
    ----------------------------------------------------------------------
    Save challenge
    ----------------------------------------------------------------------
    */

    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .insert({
        issue_id: issueId,

        title:
          generated.title ||
          `Civic Solution Challenge: ${issue.title}`,

        description:
          generated.description ||
          generated.problem_statement ||
          issue.description,

        domain: issue.domain || analysis.domain,

        problem_statement:
          generated.problem_statement ||
          analysis.actual_problem ||
          issue.description,

        expected_outcome:
          generated.expected_outcome || "",

        required_expertise:
          generated.required_expertise ||
          analysis.required_expertise ||
          [],

        resources:
          generated.resources || [],

        suggested_technology:
          generated.suggested_technology ||
          analysis.technology_data_requirements ||
          [],

        expected_deliverable:
          generated.expected_deliverable || "",

        created_by: req.user.id,

        status: "Open",
      })
      .select("*")
      .single();

    if (challengeError) {
      console.error("Challenge save error:", challengeError);

      return res.status(500).json({
        message: "Challenge was generated but could not be saved.",
      });
    }

    res.status(201).json({
      message: "Challenge generated successfully.",
      challenge,
    });
  } catch (error) {
    console.error("Challenge generation error:", error);

    res.status(500).json({
      message: "Could not generate challenge.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| ASSIGN / CLAIM ORGANIZATION
|--------------------------------------------------------------------------
| Uses the existing issue_matches table.
| Now allows organizations to claim challenges themselves.
*/
router.post("/:challengeId/assign", async (req, res) => {
  try {
    // NEW: Allow organizations to claim, plus admins to assign
    const allowedRoles = ["admin", "university", "industry", "ngo"];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "This action is not available for your role." });
    }

    const { challengeId } = req.params;
    const { organization_user_id } = req.body;

    if (!organization_user_id) {
      return res.status(400).json({
        message: "Organization is required.",
      });
    }

    // ------------------------------------------------------------
    // Get challenge
    // ------------------------------------------------------------
    const { data: challenge, error: challengeError } =
      await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

    if (challengeError || !challenge) {
      return res.status(404).json({
        message: "Challenge not found.",
      });
    }

    // ------------------------------------------------------------
    // Verify organization
    // ------------------------------------------------------------
    const { data: organization, error: orgError } =
      await supabase
        .from("users")
        .select(`
          id,
          name,
          role,
          university_details,
          industry_details
        `)
        .eq("id", organization_user_id)
        .single();

    if (
      orgError ||
      !organization ||
      !["university", "industry", "ngo"].includes(
        organization.role
      )
    ) {
      return res.status(400).json({
        message:
          "Only universities, NGOs, and industries can be assigned.",
      });
    }

    // ------------------------------------------------------------
    // Check existing assignment
    // ------------------------------------------------------------
    const { data: existingMatch, error: existingMatchError } =
      await supabase
        .from("issue_matches")
        .select("*")
        .eq("issue_id", challenge.issue_id)
        .eq("organization_user_id", organization_user_id)
        .maybeSingle();

    if (existingMatchError) {
      throw existingMatchError;
    }

    // ------------------------------------------------------------
    // IMPORTANT:
    // Do NOT overwrite an existing active assignment.
    // ------------------------------------------------------------
    if (
      existingMatch &&
      [
        "Assigned",
        "Accepted",
        "In Progress",
        "Completed",
      ].includes(existingMatch.status)
    ) {
      return res.status(400).json({
        message: `This organization is already assigned to this challenge with status "${existingMatch.status}".`,
        alreadyAssigned: true,
        match: existingMatch,
        organization,
      });
    }

    let match;

    // ------------------------------------------------------------
    // Re-use a rejected match
    // ------------------------------------------------------------
    if (existingMatch) {
      const { data, error } = await supabase
        .from("issue_matches")
        .update({
          status: "Assigned",
        })
        .eq("id", existingMatch.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      match = data;
    } else {
      // ----------------------------------------------------------
      // Create new assignment
      // ----------------------------------------------------------
      const { data, error } = await supabase
        .from("issue_matches")
        .insert({
          issue_id: challenge.issue_id,
          organization_user_id,
          matched_expertise: [],
          match_reason: req.user.role === "admin" 
            ? "Manually assigned by administrator." 
            : "Claimed directly from Open Challenge Board.",
          match_score: 100, // Bypass match score for manual claims
          status: "Assigned",
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      match = data;
    }

    // ------------------------------------------------------------
    // Challenge is now being worked on
    // ------------------------------------------------------------
    await supabase
      .from("challenges")
      .update({
        status: "In Progress",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    return res.json({
      message: "Challenge assigned successfully.",
      match,
      organization,
    });
  } catch (error) {
    console.error(
      "Assignment error:",
      error
    );

    return res.status(500).json({
      message:
        "Could not assign challenge.",
    });
  }
});


/*
|--------------------------------------------------------------------------
| UPDATE PROGRESS
|--------------------------------------------------------------------------
| Organization can move:
|
| Assigned → Accepted → In Progress → Completed
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| UPDATE PROGRESS
|--------------------------------------------------------------------------
| Organization can move:
|
| Assigned → Accepted → In Progress → Completed
|
| Each organization has its OWN independent status.
|--------------------------------------------------------------------------
*/
router.patch(
  "/:challengeId/progress",
  async (req, res) => {
    try {
      const { challengeId } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Assigned",
        "Accepted",
        "In Progress",
        "Completed",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid progress status.",
        });
      }

      /*
       * Get challenge.
       */
      const { data: challenge, error: challengeError } =
        await supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single();

      if (challengeError || !challenge) {
        return res.status(404).json({
          message: "Challenge not found.",
        });
      }

      /*
       * Find ONLY the assignment belonging
       * to the logged-in organization.
       */
      const { data: match, error: matchError } =
        await supabase
          .from("issue_matches")
          .select("*")
          .eq("issue_id", challenge.issue_id)
          .eq("organization_user_id", req.user.id)
          .maybeSingle();

      if (matchError) {
        console.error(
          "Assignment lookup error:",
          matchError
        );
      }

      if (!match) {
        return res.status(403).json({
          message:
            "You are not assigned to this challenge.",
        });
      }

      /*
       * Update ONLY this organization's assignment.
       */
      const { data: updatedMatch, error: updateError } =
        await supabase
          .from("issue_matches")
          .update({
            status,
          })
          .eq("id", match.id)
          .select("*")
          .single();

      if (updateError) {
        throw updateError;
      }

      /*
       * ---------------------------------------------------------------
       * Determine overall challenge status.
       * ---------------------------------------------------------------
       *
       * We check ALL assignments.
       */
      const { data: allAssignments, error: allAssignmentsError } =
        await supabase
          .from("issue_matches")
          .select("organization_user_id, status")
          .eq("issue_id", challenge.issue_id)
          .neq("status", "Rejected");

      if (allAssignmentsError) {
        throw allAssignmentsError;
      }

      const assignments =
        allAssignments || [];

      let challengeStatus = "Open";
      let completedAt = null;

      if (assignments.length > 0) {
        const allCompleted =
          assignments.every(
            (assignment) =>
              assignment.status === "Completed"
          );

        const anyActive =
          assignments.some(
            (assignment) =>
              [
                "Assigned",
                "Accepted",
                "In Progress",
              ].includes(assignment.status)
          );

        if (allCompleted) {
          /*
           * Only mark the whole challenge solved
           * when EVERY assigned organization has completed it.
           */
          challengeStatus = "Solved";
          completedAt =
            new Date().toISOString();
        } else if (anyActive) {
          challengeStatus = "In Progress";
        } else {
          challengeStatus = "Open";
        }
      }

      /*
       * Update overall challenge.
       */
      const { error: challengeUpdateError } =
        await supabase
          .from("challenges")
          .update({
            status: challengeStatus,
            completed_at: completedAt,
          })
          .eq("id", challengeId);

      if (challengeUpdateError) {
        throw challengeUpdateError;
      }

      return res.json({
        message: "Progress updated.",

        /*
         * The organization that just changed its status.
         */
        assignment: updatedMatch,

        /*
         * Overall challenge status.
         */
        challengeStatus,

        /*
         * Useful for frontend refresh/debugging.
         */
        allAssignments: assignments,
      });
    } catch (error) {
      console.error(
        "Progress update error:",
        error
      );

      return res.status(500).json({
        message:
          "Could not update progress.",
      });
    }
  }
);

export default router;