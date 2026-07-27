import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { User, ChatRoom, ChatMessage } from '../db.js';
import { FCMService } from '../services/fcmService.js';

const router = express.Router();

/* get chat rooms */
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    
    // get dm rooms for user if not deleted
    const rooms = await ChatRoom.find({
      type: 'dm',
      participants: userEmail,
      deletedBy: { $ne: userEmail }
    }).sort({ updatedAt: -1 });

    const filteredRooms = [];

    for (const room of rooms) {
      const roomObj = room.toObject();

      // find unread messages
      const unreadCount = await ChatMessage.countDocuments({
        chatRoomId: room.id,
        senderEmail: { $ne: userEmail },
        readBy: { $ne: userEmail }
      });
      roomObj.unreadCount = unreadCount;

      // add other user details
      const otherEmail = room.participants.find(p => p.toLowerCase() !== userEmail);
      if (otherEmail) {
        const recipient = await User.findOne({ email: otherEmail.toLowerCase() });
        if (recipient) {
          roomObj.recipient = {
            name: recipient.name,
            email: recipient.email,
            role: recipient.role,
            photo: recipient.photo || '',
            room: recipient.room || '',
            block: recipient.block || ''
          };
          roomObj.name = recipient.name;
        } else {
          roomObj.recipient = {
            name: otherEmail.split('@')[0],
            email: otherEmail,
            role: 'student',
            photo: '',
            room: '',
            block: ''
          };
          roomObj.name = otherEmail.split('@')[0];
        }
      }

      filteredRooms.push(roomObj);
    }

    res.status(200).json(filteredRooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* get messages for room */
router.get('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userEmail = req.user.email.toLowerCase();

    // check if room exists and user is in it
    const room = await ChatRoom.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (!room.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    // get messages for user if not deleted
    const messages = await ChatMessage.find({ 
      chatRoomId: roomId,
      deletedBy: { $ne: userEmail }
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* start new direct message */
router.post('/rooms/dm', authenticateToken, async (req, res) => {
  try {
    const { recipientEmail } = req.body;
    const userEmail = req.user.email.toLowerCase();

    if (!recipientEmail) {
      return res.status(400).json({ message: 'recipientEmail is required' });
    }

    const targetEmail = recipientEmail.toLowerCase();
    if (userEmail === targetEmail) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    // check if other user exists
    const recipient = await User.findOne({ email: targetEmail });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    // students can only message warden and admin
    if (req.user.role?.toLowerCase() === 'student') {
      const recipientRole = recipient.role?.toLowerCase();
      const isRecipientStaff = recipientRole === 'warden' || recipientRole === 'administrator' || recipientRole === 'admin';
      if (!isRecipientStaff) {
        return res.status(403).json({ message: 'Students are only permitted to message Wardens or Administrators' });
      }
    }

    // check if dm room exists
    let room = await ChatRoom.findOne({
      type: 'dm',
      participants: { $all: [userEmail, targetEmail] }
    });

    if (!room) {
      // make new dm room
      const roomId = `dm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      room = new ChatRoom({
        id: roomId,
        type: 'dm',
        participants: [userEmail, targetEmail],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await room.save();
    }

    const roomObj = room.toObject();
    roomObj.recipient = {
      name: recipient.name,
      email: recipient.email,
      role: recipient.role,
      photo: recipient.photo || '',
      room: recipient.room || '',
      block: recipient.block || ''
    };
    roomObj.name = recipient.name;
    roomObj.unreadCount = 0;

    res.status(200).json(roomObj);
  } catch (error) {
    console.error('Error starting direct message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* get users for directory */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    const { search = '' } = req.query;

    const query = {
      email: { $ne: userEmail } // exclude current user
    };

    // students can only see warden and admin
    if (req.user.role?.toLowerCase() === 'student') {
      query.role = { $in: ['warden', 'administrator', 'admin'] };
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // return first fifty users
    const users = await User.find(query)
      .select('name email role photo room block')
      .limit(50);

    res.status(200).json(users);
  } catch (error) {
    console.error('Error querying users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* mark messages as read */
router.post('/rooms/:roomId/read', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userEmail = req.user.email.toLowerCase();

    // check if room is valid
    const room = await ChatRoom.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (room.type === 'dm' && !room.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // add user email to read array
    await ChatMessage.updateMany(
      { chatRoomId: roomId, senderEmail: { $ne: userEmail }, readBy: { $ne: userEmail } },
      { $addToSet: { readBy: userEmail } }
    );

    res.status(200).json({ message: 'Room messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* send new message */
router.post('/rooms/:roomId/messages', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, attachment } = req.body;
    const userEmail = req.user.email.toLowerCase();

    if (!text?.trim() && !attachment) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    const room = await ChatRoom.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // check if user can access
    if (room.type === 'dm' && !room.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // students cannot write in announcements
    if (room.id === 'chan-announcements' && req.user.role?.toLowerCase() === 'student') {
      return res.status(403).json({ message: 'Students cannot post in the announcements channel' });
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const newMessage = new ChatMessage({
      id: messageId,
      chatRoomId: roomId,
      senderId: req.user.id,
      senderName: req.user.name,
      senderEmail: userEmail,
      senderRole: req.user.role,
      text: text || '',
      attachment: attachment || null,
      readBy: [userEmail], // sender has read
      createdAt: new Date()
    });

    await newMessage.save();

    // update last message for room
    room.lastMessage = {
      text: text || (attachment ? 'Shared an attachment' : ''),
      senderName: req.user.name,
      senderEmail: userEmail,
      timestamp: new Date()
    };
    room.updatedAt = new Date();

    // make room show up for other user
    const recipientEmail = room.participants.find(p => p.toLowerCase() !== userEmail);
    if (recipientEmail && room.deletedBy.includes(recipientEmail.toLowerCase())) {
      room.deletedBy = room.deletedBy.filter(email => email.toLowerCase() !== recipientEmail.toLowerCase());
    }

    await room.save();

    // add message notification to other user list in database
    if (recipientEmail) {
      try {
        const recipientUser = await User.findOne({ email: recipientEmail.toLowerCase() });
        if (recipientUser) {
          const chatNotification = {
            id: 'notif-' + Date.now(),
            title: `New Message from ${req.user.name}`,
            text: text || 'Shared a file',
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            read: false
          };
          recipientUser.notifications.unshift(chatNotification);
          recipientUser.markModified('notifications');
          await recipientUser.save();
        }
      } catch (dbErr) {
        console.error('Failed to save notification in database:', dbErr);
      }
    }

    // tell google to send fcm push notification to other user
    if (recipientEmail) {
      FCMService.sendFCMToUserIds([recipientEmail], {
        title: `New Message from ${req.user.name}`,
        body: text || 'Shared a file',
        data: {
          type: 'chat',
          targetScreen: 'chat',
          targetHash: '#chat',
          id: roomId
        }
      }).catch(err => console.error('[FCMService] Failed sending message push:', err.message));
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* delete chat */
router.delete('/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userEmail = req.user.email.toLowerCase();

    const room = await ChatRoom.findOne({ id: roomId });
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // check if user is in room
    if (!room.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Access denied: You are not a participant in this conversation' });
    }

    // add user email to room delete list
    await ChatRoom.updateOne({ id: roomId }, { $addToSet: { deletedBy: userEmail } });

    // add user email to message delete list
    await ChatMessage.updateMany({ chatRoomId: roomId }, { $addToSet: { deletedBy: userEmail } });

    // if both deleted then remove from database
    const updatedRoom = await ChatRoom.findOne({ id: roomId });
    if (updatedRoom) {
      const allDeleted = updatedRoom.participants.every(p => 
        updatedRoom.deletedBy.includes(p.toLowerCase())
      );
      if (allDeleted) {
        await ChatMessage.deleteMany({ chatRoomId: roomId });
        await ChatRoom.deleteOne({ id: roomId });
      }
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
