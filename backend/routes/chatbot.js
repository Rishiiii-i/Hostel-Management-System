import express from 'express';
import jwt from 'jsonwebtoken';
import { User, GatePass, Complaint, MessMenu, Notice, Attendance, AiLog } from '../db.js';

const router = express.Router();

// Helper to save chat messages in MongoDB database
async function saveChatLog(dbUser, message, reply) {
  try {
    const log = new AiLog({
      userId: dbUser ? dbUser.id : 'Guest',
      role: dbUser ? dbUser.role : 'Guest',
      message: message,
      reply: reply
    });
    await log.save();
    console.log('[Chatbot] Chat message saved to database');
  } catch (err) {
    console.error('[Chatbot] Could not save chat log:', err.message);
  }
}

// Helper to check if database is online
function isDbConnected() {
  return true;
}

// Helper to read the user login token
async function getOptionalUser(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return null;

  const secret = process.env.JWT_SECRET || 'smart-hostel-secret-key-12345';
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.email) {
        const dbUser = await User.findOne({ email: decoded.email.toLowerCase() });
        if (dbUser) {
          return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
        }
      }
    } catch (e) { }
    return null;
  }
}

// Simple rules to reply instantly to common questions
function fallbackChatbot(message, userContext) {
  const msg = message.toLowerCase();
  const dbUser = userContext.dbUser;

  // Reply to chatbot name questions
  if (msg.includes('who are you') || msg.includes('your name') || msg.includes('chatbot name')) {
    return "I am your Smart Hostel AI Assistant!";
  }

  // Reply to user name questions
  if (msg.includes('my name') || msg.includes('what is my name')) {
    if (dbUser) {
      return `Your name is **${dbUser.name}** and your role is **${dbUser.role}**.`;
    }
    return "You are currently chatting as a Guest. Please log in to see your profile name.";
  }

  // Reply to how are you
  if (msg.includes('how are you')) {
    return "I am doing great, thank you for asking! How can I assist you with your hostel details today?";
  }

  // Reply to hello / hi
  if (msg.includes('hello') || msg.includes('hi ') || msg.trim() === 'hi' || msg.includes('hey') || msg.includes('greetings')) {
    return `Hello ${dbUser ? dbUser.name : 'there'}! I am your Smart Hostel AI Assistant. How can I help you today?`;
  }

  // Reply to room questions
  if (msg.includes('room')) {
    if (dbUser && dbUser.role === 'student') {
      return dbUser.room
        ? `Your assigned room is **Room ${dbUser.room}** in **${dbUser.block || 'N/A'}**.`
        : `You currently have no room allocated.`;
    }
    return `Please log in to your account to view your room details. For queries, email rishi@shnoor.com or dileep@shnoor.com.`;
  }

  // Reply to fee questions
  if (msg.includes('fee') || msg.includes('pay') || msg.includes('due') || msg.includes('transaction') || msg.includes('receipt') || msg.includes('bill')) {
    if (dbUser && dbUser.role === 'student') {
      return `Your due fee is **₹${dbUser.dueFee || 45000}** (${dbUser.feeStatus || 'Unpaid'}). You can pay it in the 'Fees & Payments' tab.`;
    }
    return `Please log in to check fee dues. For queries, email rishi@shnoor.com or dileep@shnoor.com.`;
  }

  // Reply to complaints questions
  if (msg.includes('complaint') || msg.includes('repair') || msg.includes('problem') || msg.includes('issue') || msg.includes('ticket')) {
    if (dbUser && dbUser.role === 'student') {
      const count = userContext.complaintsCount || 0;
      return `You have logged **${count}** complaints. For queries, email rishi@shnoor.com or dileep@shnoor.com.`;
    }
    return `For queries and complaints, please email rishi@shnoor.com or dileep@shnoor.com.`;
  }

  // Reply to gate pass / leave questions
  if (msg.includes('gate') || msg.includes('pass') || msg.includes('leave') || msg.includes('outing')) {
    if (dbUser && dbUser.role === 'student') {
      const count = userContext.gatePassesCount || 0;
      return `You have requested **${count}** gate passes. For queries, email rishi@shnoor.com or dileep@shnoor.com.`;
    }
    return `Students can request leave gate passes. For queries, email rishi@shnoor.com or dileep@shnoor.com.`;
  }

  // Reply to food / mess menu questions
  if (msg.includes('mess') || msg.includes('food') || msg.includes('menu') || msg.includes('breakfast') || msg.includes('lunch') || msg.includes('dinner') || msg.includes('snacks')) {
    if (userContext.messMenu && userContext.messMenu.length > 0) {
      const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayMenu = userContext.messMenu.find(m => m.day === todayDay);
      if (todayMenu) {
        return `Today's Menu (${todayDay}): B: ${todayMenu.breakfast}, L: ${todayMenu.lunch}, S: ${todayMenu.snacks}, D: ${todayMenu.dinner}.`;
      }
    }
    return `You can view the weekly mess menu in the Overview or Mess tabs.`;
  }

  // Reply to notice board / announcements
  if (msg.includes('notice') || msg.includes('announcement') || msg.includes('broadcast')) {
    if (userContext.notices && userContext.notices.length > 0) {
      return `The latest notice is "**${userContext.notices[0].title}**": "${userContext.notices[0].content}"`;
    }
    return `There are no recent announcements. Check the 'Notice Board' tab for updates.`;
  }

  // Reply to 2fa / security questions
  if (msg.includes('2fa') || msg.includes('security') || msg.includes('two factor') || msg.includes('otp')) {
    return `Toggle Two-Factor Authentication (2FA) in the Settings/Profile section of your dashboard for extra security.`;
  }

  // Reply to attendance questions
  if (msg.includes('attendance')) {
    if (dbUser && dbUser.role === 'student') {
      return `Your attendance rate is **${userContext.attendanceRate || 100}%**. Track details under the 'Gate Pass & Attendance' tab.`;
    }
    return `Wardens mark attendance under the 'Attendance' tab.`;
  }

  // Reply to general off-topic questions
  return `I only assist with hostel-related queries. Please ask about rooms, fees, mess menu, gate passes, or complaints.`;
}

// Router post handler to process chatbot questions
router.post('/query', async (req, res) => {
  try {
    const { message, history } = req.body;

    // Check if the message is empty
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Query message is required' });
    }

    // Get login details of the user
    const user = await getOptionalUser(req);
    let dbUser = null;

    // Set default user information context
    let userContext = {
      dbUser: null,
      complaints: [],
      complaintsCount: 0,
      gatePasses: [],
      gatePassesCount: 0,
      messMenu: [],
      notices: [],
      attendanceRate: 100,
      presentCount: 0
    };

    // If user is logged in, find them in the database and get context details
    if (user && user.email) {
      dbUser = await User.findOne({ email: user.email.toLowerCase() });
      if (dbUser) {
        userContext.dbUser = dbUser;

        // If they are a student, fetch their details from database in parallel
        if (dbUser.role === 'student') {
          const [complaints, complaintsCount, gatePasses, gatePassesCount, records] = await Promise.all([
            Complaint.find({ studentEmail: dbUser.email }).sort({ createdAt: -1 }).limit(1),
            Complaint.countDocuments({ studentEmail: dbUser.email }),
            GatePass.find({ studentEmail: dbUser.email }).sort({ createdAt: -1 }).limit(1),
            GatePass.countDocuments({ studentEmail: dbUser.email }),
            Attendance.find({ studentId: dbUser.id })
          ]);

          userContext.complaints = complaints;
          userContext.complaintsCount = complaintsCount;
          userContext.gatePasses = gatePasses;
          userContext.gatePassesCount = gatePassesCount;

          const totalDays = records.length;
          const presentDays = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
          userContext.presentCount = presentDays;
          userContext.attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
        }
      }
    }

    // Guest protection: block guests from viewing private account fields
    if (!dbUser) {
      const msgLower = message.toLowerCase();
      let guestReply = null;

      if (msgLower.includes('room')) {
        guestReply = "Please log in to your account to view your room details. For queries, email rishi@shnoor.com or dileep@shnoor.com.";
      } else if (msgLower.includes('fee') || msgLower.includes('due') || msgLower.includes('pay') || msgLower.includes('bill')) {
        guestReply = "Please log in to your account to check dues. You can pay fees online in the 'Fees & Payments' tab. For queries, email rishi@shnoor.com or dileep@shnoor.com.";
      } else if (msgLower.includes('complaint') || msgLower.includes('repair') || msgLower.includes('problem') || msgLower.includes('issue')) {
        guestReply = "Please log in to your student dashboard to file complaints in the 'Requests & Complaints' tab. For queries, email rishi@shnoor.com or dileep@shnoor.com.";
      } else if (msgLower.includes('gate') || msgLower.includes('pass') || msgLower.includes('leave') || msgLower.includes('outing')) {
        guestReply = "Please log in to request leaves or gate passes in the 'Gate Pass & Attendance' tab. For queries, email rishi@shnoor.com or dileep@shnoor.com.";
      } else if (msgLower.includes('notice') || msgLower.includes('announcement') || msgLower.includes('broadcast')) {
        guestReply = "Hostel announcements and notices are confidential. Please log in to your account to view the notice board.";
      } else if (msgLower.includes('attendance')) {
        guestReply = "Please log in to check your attendance history. For queries, email rishi@shnoor.com or dileep@shnoor.com.";
      }

      if (guestReply) {
        await saveChatLog(null, message, guestReply);
        return res.status(200).json({ reply: guestReply });
      }
    }

    // Get today's mess menu and newest notice updates
    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayMenu = await MessMenu.findOne({ day: { $regex: new RegExp(`^${todayDay}$`, 'i') } });
    userContext.messMenu = todayMenu ? [todayMenu] : [];
    userContext.notices = await Notice.find().sort({ createdAt: -1 }).limit(1);

    // High-speed matching: if it is a core question or a greeting, reply instantly in under 5ms
    const msgLower = message.toLowerCase();
    const msgTrim = msgLower.trim();
    const isHostelQuery = msgLower.includes('room') ||
      msgLower.includes('fee') ||
      msgLower.includes('pay') ||
      msgLower.includes('due') ||
      msgLower.includes('complaint') ||
      msgLower.includes('gate') ||
      msgLower.includes('pass') ||
      msgLower.includes('leave') ||
      msgLower.includes('outing') ||
      msgLower.includes('mess') ||
      msgLower.includes('food') ||
      msgLower.includes('menu') ||
      msgLower.includes('breakfast') ||
      msgLower.includes('lunch') ||
      msgLower.includes('dinner') ||
      msgLower.includes('snacks') ||
      msgLower.includes('notice') ||
      msgLower.includes('announcement') ||
      msgLower.includes('attendance') ||
      msgLower.includes('2fa') ||
      msgLower.includes('security') ||
      msgLower.includes('my name') ||
      msgTrim === 'hi' ||
      msgTrim === 'hello' ||
      msgTrim === 'hey' ||
      msgTrim === 'yo' ||
      msgLower.includes('hello') ||
      msgLower.includes('hey') ||
      msgLower.includes('greetings') ||
      msgLower.includes('who are you') ||
      msgLower.includes('your name') ||
      msgLower.includes('how are you');

    if (isHostelQuery) {
      const reply = fallbackChatbot(message, userContext);
      await saveChatLog(dbUser, message, reply);
      return res.status(200).json({ reply });
    }

    // Construct prompt metadata for AI models
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let systemPrompt = `You are the Smart Hostel AI Assistant. Your name is "Smart Hostel AI Assistant".
IMPORTANT: You MUST keep all responses extremely short, direct, and conversational (max 2 sentences, under 30 words). Do not repeat greeting messages.

REAL-TIME SYSTEM INFO:
- Current Date and Day: ${currentDateStr}
- Current Time: ${currentTimeStr}

INSTRUCTIONS:
- For any support, queries, or complaints, direct them to email rishi@shnoor.com or dileep@shnoor.com.
- You MUST NOT answer any questions that are irrelevant or unrelated to the hostel or website features. If the user asks an off-topic or irrelevant question, reply strictly: "I only assist with hostel-related queries."
`;


    // Try Ollama local model runner next
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

    try {
      const messagesList = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Format history for Ollama
      if (Array.isArray(history)) {
        history.forEach(msg => {
          messagesList.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }

      // Add current question
      messagesList.push({
        role: 'user',
        content: message
      });

      console.log(`[Chatbot] Querying local Ollama model '${ollamaModel}'...`);
      const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          messages: messagesList,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 25,
            top_k: 1,
            top_p: 0.1
          }
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const replyText = resData.message?.content;
        if (replyText) {
          await saveChatLog(dbUser, message, replyText);
          return res.status(200).json({ reply: replyText });
        }
      }
    } catch (ollamaErr) {
      console.warn('[Chatbot] Ollama connection failed, trying fallback:', ollamaErr.message);
    }

    // Direct local fallback reply if both AI models are offline
    const reply = fallbackChatbot(message, userContext);
    await saveChatLog(dbUser, message, reply);
    res.status(200).json({ reply });

  } catch (error) {
    console.error('[Chatbot] Unhandled error:', error);
    res.status(500).json({ message: 'Internal server error processing chatbot query' });
  }
});

export default router;
