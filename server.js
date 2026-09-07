require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
// Initialize Gemini (Make sure to add GEMINI_API_KEY to your backend .env file!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.use(express.json({ limit: '10mb' })); // Increased limit for Base64 images!
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Clean Database Connected!'))
  .catch(err => console.log('❌ DB Error:', err.message));

// --- MODELS (6 Collections) ---
// Add flagCount to User
const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String, role: String, coins: { type: Number, default: 0 }, flagCount: { type: Number, default: 0 } }));

// THE FIX: Added imageUrl and comments to the Ticket (Issue) Schema!
const Ticket = mongoose.model('Ticket', new mongoose.Schema({ 
  ticketId: String, 
  title: String, 
  description: String, 
  location: String,
  submittedBy: String, 
  submitterRole: { type: String, default: 'citizen' }, 
  analyzed: { type: Boolean, default: false }, 
  status: { type: String, default: 'open' }, 
  createdAt: { type: Date, default: Date.now },
  domain: String,
  priority: String,
  requiredExpertise: [String],
  solutionIdea: String,
  matchedOrganizations: Array,
  // --- NEW PHASE 1 SOCIAL FEATURES ---
  imageUrl: { type: String, default: "" },
  isFlagged: { type: Boolean, default: false }, // NEW FIELD
  comments: [{
    text: String,
    postedBy: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
  }]
}));

const Challenge = mongoose.model('Challenge', new mongoose.Schema({ title: String, description: String }));
const Proposal = mongoose.model('Proposal', new mongoose.Schema({ challengeId: String, solution: String }));
const SensorData = mongoose.model('SensorData', new mongoose.Schema({ sensorType: String, reading: String, timestamp: { type: Date, default: Date.now } }));
const Message = mongoose.model('Message', new mongoose.Schema({ senderId: String, content: String }));

// --- ESSENTIAL APIs ---

// Users & Auth (Basic Login)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, name, referredBy } = req.body; 
    console.log("REGISTER ATTEMPT:", email); 

    const user = await new User({ username: email, password, role }).save();
    
    // --- REFERRAL COIN BONUS LOGIC ---
    if (referredBy) {
      try {
        await User.findByIdAndUpdate(referredBy, { $inc: { coins: 50 } });
        console.log(`🎁 Referral Bonus! Awarded 50 coins to user ${referredBy}`);
      } catch (err) {
        console.log("Invalid referral ID, skipping bonus.");
      }
    }
    // ---------------------------------
    
    res.json({ 
      message: 'User created successfully',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      user: { 
        id: user._id,
        email: user.username, 
        name: name || user.username, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error("CRASH IN REGISTER:", error); 
    res.status(500).json({ message: 'Error creating account' }); 
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body; 
    console.log("LOGIN ATTEMPT:", email, password); 

    const user = await User.findOne({ username: email, password });
    
    if (user) {
      console.log("LOGIN SUCCESS FOR:", email);
      res.json({ 
        message: 'Login successful',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
        user: { 
          id: user._id,
          email: user.username, 
          name: user.username, 
          role: user.role 
        }
      });
    } else {
      console.log("LOGIN FAILED: Wrong email or password");
      res.status(401).json({ message: 'Invalid credentials. Wrong email or password.' });
    }
  } catch (error) {
    console.error("CRASH IN LOGIN:", error); 
    res.status(500).json({ message: 'Server crash during login' });
  }
});

// Fetch user details (for the wallet balance)
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// --- CUSTOMER LIFECYCLE ROUTES (Account Settings) ---

// 1. Update User Profile
app.put("/api/users/:id", async (req, res) => {
  try {
    // Finds the user by ID and updates only the provided fields
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { 
        name: req.body.name, 
        email: req.body.email, 
        phone: req.body.phone, 
        address: req.body.address 
      }, 
      { new: true } // Tells MongoDB to send back the newly updated data
    );
    
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

// 2. Delete User Account
app.delete("/api/users/:id", async (req, res) => {
  try {
    // Permanently removes the user from the database
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error deleting account" });
  }
});

// You probably already have this at the top of your file from your register route!
const bcrypt = require("bcrypt"); 

// 3. Update User Password
app.put("/api/users/:id/password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    
    // Encrypt the new password before saving it to MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error updating password" });
  }
});
// --- REDEEM COINS ROUTE ---
app.post('/api/users/:id/redeem', async (req, res) => {
  try {
    const { cost } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.coins < cost) return res.status(400).json({ message: 'Not enough coins' });
    
    // Deduct the coins and save to the database permanently
    user.coins -= cost;
    await user.save();
    
    console.log(`🛍️ User ${user.username} spent ${cost} coins. Remaining balance: ${user.coins}`);
    res.json({ coins: user.coins });
  } catch (error) {
    console.error("CRASH IN REDEEM:", error);
    res.status(500).json({ message: 'Error processing redemption' });
  }
});

// Complaints / Tickets
app.post('/complaints', async (req, res) => {
  const count = await Ticket.countDocuments();
  const generatedId = `TKT-${(count + 1).toString().padStart(3, '0')}`; 
  const ticketData = { ...req.body, ticketId: generatedId };
  const ticket = await new Ticket(ticketData).save();
  res.json({ message: 'Complaint logged', ticket });
});

app.get('/api/issues', async (req, res) => {
  try {
    const issues = await Ticket.find().sort({ createdAt: -1 }); // Added sort so newest posts show first!
    res.json(issues);
  } catch (error) {
    console.error("CRASH IN /api/issues:", error); 
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

app.post('/api/issues', async (req, res) => {
  try {
    const { title, description, location, submittedBy, submitterRole, imageUrl } = req.body; 
    console.log("NEW TICKET SUBMITTED:", title);

    // --- NEW MODERATION CHECK: 3 STRIKES RULE ---
    if (submittedBy && submittedBy !== 'anonymous') {
      const postingUser = await User.findById(submittedBy);
      if (postingUser && postingUser.flagCount >= 3) {
        console.log(`🚫 Blocked banned user ${submittedBy} from posting.`);
        return res.status(403).json({ 
          message: 'Your account has been restricted from posting due to multiple community guidelines violations.' 
        });
      }
    }
    // ---------------------------------------------

    const newTicket = await new Ticket({ 
      title, 
      description, 
      location,
      submittedBy, 
      submitterRole: submitterRole || 'citizen',
      imageUrl: imageUrl || "", 
      analyzed: false
    }).save();
    
    res.json(newTicket);
  } catch (error) {
    console.error("CRASH IN POST /api/issues:", error);
    res.status(500).json({ message: 'Server crash saving the issue' });
  }
});

// --- NEW ROUTE: ADD A COMMENT ---
app.post('/api/issues/:id/comments', async (req, res) => {
  try {
    const { text, postedBy, role } = req.body;
    const issue = await Ticket.findById(req.params.id);
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.comments.push({ text, postedBy, role });
    await issue.save();
    
    res.json(issue);
  } catch (error) {
    console.error("CRASH IN POST COMMENT:", error);
    res.status(500).json({ message: 'Error saving comment' });
  }
});

// --- DELETE ISSUE ROUTE ---
app.delete('/api/issues/:id', async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error("CRASH IN DELETE ISSUE:", error);
    res.status(500).json({ message: 'Failed to delete issue' });
  }
});

// --- DELETE COMMENT ROUTE ---
app.delete('/api/issues/:id/comments/:commentId', async (req, res) => {
  try {
    const issue = await Ticket.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    // Mongoose automatically assigns an _id to items in an array. We filter it out!
    issue.comments = issue.comments.filter(c => c._id.toString() !== req.params.commentId);
    await issue.save();
    
    res.json(issue);
  } catch (error) {
    console.error("CRASH IN DELETE COMMENT:", error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

app.get('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Ticket.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    console.error("CRASH IN GET /api/issues/:id:", error);
    res.status(500).json({ message: 'Failed to fetch the issue details' });
  }
});

app.get('/tickets', async (req, res) => res.json(await Ticket.find()));
app.get('/tickets/:id', async (req, res) => res.json(await Ticket.findById(req.params.id)));
app.put('/tickets/:id', async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Ticket updated', ticket });
});

// Challenges, Proposals, Sensor Data, Messages
app.post('/challenges', async (req, res) => res.json(await new Challenge(req.body).save()));
app.get('/challenges', async (req, res) => res.json(await Challenge.find()));
app.post('/proposals', async (req, res) => res.json(await new Proposal(req.body).save()));
app.get('/proposals', async (req, res) => res.json(await Proposal.find()));
app.post('/sensor-data', async (req, res) => res.json(await new SensorData(req.body).save()));
app.get('/sensor-data', async (req, res) => res.json(await SensorData.find()));
app.post('/messages', async (req, res) => res.json(await new Message(req.body).save()));
app.get('/messages', async (req, res) => res.json(await Message.find()));

// --- AI ANALYSIS ROUTE (Dashboard button) ---
// --- AI ANALYSIS ROUTE (Dashboard button) ---
// --- ADMIN FLAG ROUTE ---
app.post('/api/issues/:id/flag', async (req, res) => {
  try {
    const issue = await Ticket.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Mark the issue as flagged
    issue.isFlagged = true;
    await issue.save();

    // Add a strike to the user's account if they aren't anonymous
    if (issue.submittedBy && issue.submittedBy !== 'anonymous') {
      await User.findByIdAndUpdate(issue.submittedBy, { $inc: { flagCount: 1 } });
      console.log(`🚩 User ${issue.submittedBy} received a moderation strike.`);
    }

    res.json(issue);
  } catch (error) {
    console.error("CRASH IN FLAG ROUTE:", error);
    res.status(500).json({ message: 'Failed to flag issue' });
  }
});

app.post('/api/issues/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    console.log(`[AI AGENT] Asking Gemini to analyze: ${ticket.title}...`);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // THE FIX: We updated the prompt to demand real Indian organizations!
    const prompt = `
      You are an expert civic planning AI for a platform called Nagrik Nova.
      Analyze this community issue located in India:
      Title: "${ticket.title}"
      Description: "${ticket.description}"
      Location: "${ticket.location}"
      
      Respond strictly with a RAW JSON object. Do not include markdown formatting or backticks. 
      Use exactly these keys:
      - "domain": A short category (e.g., "Urban Infrastructure", "Public Health", "Sanitation")
      - "priority": Strictly one of ["High", "Medium", "Low"]
      - "requiredExpertise": An array of 2-3 specific skills needed (e.g., ["Civil Engineering", "Data Analytics"])
      - "solutionIdea": A concise, 2-sentence actionable solution pathway.
      - "matchedOrganizations": An array of 2 to 3 REAL-WORLD Indian organizations (NGOs, Universities, or Industries) that actually exist and specialize in solving this exact type of problem. 
        Format each object in the array exactly like this:
        {"role": "ngo" (or "university" or "industry"), "name": "Actual Real-World Organization Name", "expertise": ["Their specific relevant skill"]}
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    ticket.analyzed = true;
    ticket.domain = aiData.domain;
    ticket.priority = aiData.priority;
    ticket.requiredExpertise = aiData.requiredExpertise;
    ticket.solutionIdea = aiData.solutionIdea;
    
    // THE FIX: We map the AI's dynamic real-world organizations directly into the ticket!
    if (aiData.matchedOrganizations && Array.isArray(aiData.matchedOrganizations)) {
      ticket.matchedOrganizations = aiData.matchedOrganizations.map((org, index) => ({
        userId: `org-ai-${index}-${Date.now()}`, // Temporary ID for the UI key mapping
        role: org.role.toLowerCase(),
        name: org.name,
        expertise: org.expertise || aiData.requiredExpertise
      }));
    } else {
      ticket.matchedOrganizations = [];
    }

    // --- COIN REWARD LOGIC ---
    let coinReward = 10; 
    if (aiData.priority === "High") coinReward = 50;
    else if (aiData.priority === "Medium") coinReward = 30;

    if (ticket.submittedBy) {
      await User.findByIdAndUpdate(ticket.submittedBy, {
        $inc: { coins: coinReward }
      });
      console.log(`🪙 Dashboard Analysis: Awarded ${coinReward} coins to user ${ticket.submittedBy}`);
    }

    await ticket.save();
    res.json(ticket);

  } catch (error) {
    console.error("CRASH IN AI ANALYZE:", error);
    res.status(500).json({ message: 'AI Analysis failed' });
  }
});

// --- AI CHATBOT ROUTE (Nova Chat Widget) ---
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, history, userId } = req.body; 
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });

        const dbContext = await Ticket.find({ status: { $ne: 'resolved' } }).limit(3); 
        const dbContextString = dbContext.length > 0
            ? JSON.stringify(dbContext.map(i => ({ description: i.description, status: i.status })))
            : "No active local issues found.";

        const historyTranscript = history && history.length > 0
            ? history.map(m => `${m.role === 'user' ? 'Citizen' : 'Nova'}: ${m.text}`).join('\n')
            : "No previous conversation.";

        const prompt = `
        You are Nova, the official Nationwide Civic AI Agent for Nagrik Nova across India. 
        Help citizens report infrastructure issues conversationally for any city or state.
        
        Read the conversation history, then reply to the citizen's latest message.
        You must extract: description, category (e.g., Infrastructure, Road Safety), location (anywhere in India), and severity (1 to 3).
        
        [CONVERSATION HISTORY]
        ${historyTranscript}
        
        [CURRENT DATABASE CONTEXT]
        ${dbContextString}
        
        [CITIZEN'S LATEST MESSAGE]
        Citizen: "${message}"

        CRITICAL INSTRUCTION: You MUST respond ONLY with a raw JSON object using exactly these keys. Do not include markdown:
        {
          "message": "Your conversational reply based on the history. Ask for missing details, or thank them if the report is complete.",
          "dataToSave": {
            "description": "extracted string or empty",
            "category": "extracted string or empty",
            "location": "extracted string or empty",
            "severity": 1,
            "title": "A short 4-word title for the issue" 
          },
          "status": "processing or final_report"
        }
        `;

        const result = await model.generateContent(prompt);
        let aiResponseString = result.response.text();
        
        aiResponseString = aiResponseString.replace(/```json/g, '').replace(/```/g, '').trim();
        let aiResultData = JSON.parse(aiResponseString);
        
        if (aiResultData.status === 'final_report') {
            if (aiResultData.dataToSave.description && aiResultData.dataToSave.location) {
                
                const ticketData = {
                  ...aiResultData.dataToSave,
                  submittedBy: userId || 'anonymous' 
                };

                const newTicket = new Ticket(ticketData);
                await newTicket.save();
                
                if (userId) {
                    let coinReward = 10; 
                    if (aiResultData.dataToSave.severity === 3) coinReward = 50;
                    else if (aiResultData.dataToSave.severity === 2) coinReward = 30;

                    await User.findByIdAndUpdate(userId, {
                        $inc: { coins: coinReward }
                    });
                    console.log(`🪙 Chatbot: Awarded ${coinReward} coins to user ${userId}`);
                    aiResultData.message += ` (Report submitted! You just earned ${coinReward} Nova Coins!)`;
                } else {
                    aiResultData.message += ` (Report submitted! Login next time to earn Nova Coins.)`;
                }
                
            } else {
                aiResultData.status = 'processing';
                aiResultData.message = "I almost have everything, but I just need to confirm the exact location and description before I save this. Could you clarify?";
            }
        }

        const finalMessage = aiResultData.message || "I understood, but my response got jumbled. Could you clarify?";
        res.json({ message: finalMessage });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to process AI request." });
    }
});

// THE NEW AI ENDPOINT
app.post("/api/vision", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Strip the "data:image/jpeg;base64," prefix so Gemini can read the raw data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // We use the flash model because it is highly optimized for fast image processing
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    
    // THE FIX: Updated prompt to strictly exclude recommendations
const prompt = `You are an expert civic infrastructure AI assistant named Nova AI. 
Analyze this image of a civic issue (e.g., pothole, broken pipe, illegal dumping). 
Provide a short, clear title (max 6 words). 
Provide a detailed description explaining exactly what the issue is and the potential hazard to citizens. 
CRITICAL: DO NOT provide any solutions, fixes, or recommended civic actions. Leave that for the admin team.

You MUST return ONLY a valid JSON object in this exact format, with no other text or markdown:
{"title": "your title here", "description": "your description here"}`;
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    
    // Clean up the response in case Gemini wraps it in markdown code blocks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanJson);

    res.json(aiData);
    
  } catch (error) {
    console.error("AI Vision Error:", error);
    res.status(500).json({ error: "Nova AI failed to analyze the image." });
  }
});

// --- START SERVER ---
app.listen(5000, () => console.log('Server live on port 5000'));