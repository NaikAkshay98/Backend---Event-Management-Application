const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Add emulator configuration
if (process.env.FIREBASE_EMULATOR === "true") {
    db.settings({
      host: "localhost:8080", // Firestore emulator default port
      ssl: false,
    });
  }

// Create Event
exports.createEvent = functions.https.onRequest(async (req, res) => {
  try {
    console.log("Starting to create event...");
    const eventData = req.body; // Assume data is sent in JSON format
    console.log("Event data received:", eventData);

    const event = {
      ...eventData,
     // updatedAt: admin.firestore.Timestamp.now(), // Use Timestamp.now()
    };

    //console.log("Prepared event object:", event);

    const newEvent = await db.collection("events").add(event);
    //console.log("Event successfully added with ID:", newEvent.id);

    res.status(201).send({success: true, id: newEvent.id});
  } catch (error) {
   // console.error("Error creating event:", error);
    res.status(500).send({success: false, message: error.message});
  }
});


// Get All Events
exports.getAllEvents = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    const events = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({success: false, message: error.message});
  }
});

// Get Event by ID
exports.getEventById = functions.https.onRequest(async (req, res) => {
  const {id} = req.query;
  try {
    const eventDoc = await db.collection("events").doc(id).get();
    if (!eventDoc.exists) {
      res.status(404).send({success: false, message: "Event not found"});
    } else {
      res.status(200).send({id: eventDoc.id, ...eventDoc.data()});
    }
  } catch (error) {
    res.status(500).send({success: false, message: error.message});
  }
});

// Update Event
exports.updateEvent = functions.https.onRequest(async (req, res) => {
  const {id, ...eventData} = req.body; // Assume `id` is part of the request
  try {
    await db.collection("events").doc(id).update({
      ...eventData,
      //updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).send({
      success: true,
      message: "Event updated successfully",
    });
  } catch (error) {
    res.status(500).send({success: false, message: error.message});
  }
});

// Delete Event
exports.deleteEvent = functions.https.onRequest(async (req, res) => {
  const {id} = req.query;
  try {
    await db.collection(
        "events").doc(id).delete();
    res.status(200).send({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).send({success: false, message: error.message});
  }
});

// Filter Events
exports.filterEvents = functions.https.onRequest(async (req, res) => {
  const {eventType, date} = req.query; // Use query params for filters
  let query = db.collection("events");
  try {
    if (eventType) {
      query = query.where("eventType", "==", eventType);
    }
    if (date) {
      query = query.where("date", "==", date);
    }
    const snapshot = await query.get();
    const events = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({success: false, message: error.message});
  }
});


