const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { db, admin } = require("./src/utils/firebase");
const { FieldValue } = require("firebase-admin/firestore");
const { validateInput } = require("./src/utils/validationHelper");
const {
  eventSchema,
  updateEventSchema,
  deleteEventSchema,
  getEventByIdSchema,
  filterEventsSchema,
} = require("./src/utils/validationSchemas");
const { handleError } = require("./src/utils/errorHandler");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  filterEvents,
} = require("./src/handlers/eventHandlers");

/**
 * Middleware to verify Firebase ID tokens for secure routes.
 * This ensures only authenticated users can access certain endpoints.
 *
 * @param {Function} handler - The actual route handler to be executed if authentication passes.
 * @returns {Function} - A wrapped handler with authentication logic.
 */
const authenticate = (handler) => {
  return async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("Unauthorized access attempt: No token provided.");
      return res.status(401).send({ success: false, message: "Unauthorized: No token provided." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken; // Attach user info (e.g., email, UID) to the request
      return handler(req, res); // Pass control to the secured handler
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).send({ success: false, message: "Unauthorized: Invalid token." });
    }
  };
};

/**
 * Create Event Endpoint (Authenticated)
 */
exports.createEvent = functions.https.onRequest(authenticate((req, res) => {
  console.log("Received createEvent request:", { method: req.method, body: req.body });

  const isValid = validateInput(req.body, eventSchema, res);
  if (!isValid) return;

  try {
    const eventData = req.body;
    console.log("Processing event creation for:", eventData);

    const event = {
      ...eventData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    db.collection("events")
      .add(event)
      .then((docRef) => {
        console.log("Event created successfully:", { id: docRef.id, event });
        res.status(201).send({ success: true, id: docRef.id });
      })
      .catch((error) => {
        handleError(res, error, "createEvent");
      });
  } catch (error) {
    handleError(res, error, "Unexpected error in createEvent");
  }
}));

/**
 * Get All Events Endpoint (Public)
 */
exports.getAllEvents = functions.https.onRequest((req, res) => {
  console.log("Received getAllEvents request:", { method: req.method });

  cors(req, res, async () => {
    try {
      console.log("Fetching all events...");
      const snapshot = await db.collection("events").get();

      if (snapshot.empty) {
        console.warn("No events found.");
        return res.status(204).send([]);
      }

      const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Events fetched successfully:", events);
      res.status(200).send(events);
    } catch (error) {
      handleError(res, error, "getAllEvents");
    }
  });
});

/**
 * Get Event By ID Endpoint (Authenticated)
 */
exports.getEventById = functions.https.onRequest(authenticate((req, res) => {
  console.log("Received getEventById request:", { method: req.method, query: req.query });

  const isValid = validateInput(req.query, getEventByIdSchema, res);
  if (!isValid) return;

  cors(req, res, async () => {
    const { id } = req.query;

    try {
      console.log("Fetching event with ID:", id);
      const eventDoc = await db.collection("events").doc(id).get();

      if (!eventDoc.exists) {
        console.warn("Event not found for ID:", id);
        return res.status(404).send({ success: false, message: "Event not found" });
      }

      console.log("Event fetched successfully:", { id: eventDoc.id, ...eventDoc.data() });
      res.status(200).send({ id: eventDoc.id, ...eventDoc.data() });
    } catch (error) {
      handleError(res, error, "getEventById");
    }
  });
}));

/**
 * Update Event Endpoint (Authenticated)
 */
exports.updateEvent = functions.https.onRequest(authenticate((req, res) => {
  console.log("Received updateEvent request:", { method: req.method, body: req.body });

  const isValid = validateInput(req.body, updateEventSchema, res);
  if (!isValid) return;

  cors(req, res, async () => {
    const { id, ...eventData } = req.body;

    try {
      console.log("Updating event with ID:", id);
      await db.collection("events").doc(id).update({
        ...eventData,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log("Event updated successfully:", { id, eventData });
      res.status(200).send({ success: true, message: "Event updated successfully" });
    } catch (error) {
      handleError(res, error, "updateEvent");
    }
  });
}));

/**
 * Delete Event Endpoint (Authenticated)
 */
exports.deleteEvent = functions.https.onRequest(authenticate((req, res) => {
  console.log("Received deleteEvent request:", { method: req.method, query: req.query });

  const isValid = validateInput(req.query, deleteEventSchema, res);
  if (!isValid) return;

  cors(req, res, async () => {
    const { id } = req.query;

    try {
      console.log("Deleting event with ID:", id);
      await db.collection("events").doc(id).delete();
      console.log("Event deleted successfully:", { id });
      res.status(200).send({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      handleError(res, error, "deleteEvent");
    }
  });
}));

/**
 * Filter Events Endpoint (Public)
 */
exports.filterEvents = functions.https.onRequest((req, res) => {
  console.log("Received filterEvents request:", { method: req.method, query: req.query });

  const isValid = validateInput(req.query, filterEventsSchema, res);
  if (!isValid) return;

  cors(req, res, async () => {
    const { eventType, startDate, endDate } = req.query;
    let query = db.collection("events");

    try {
      if (eventType) {
        console.log(`Filtering by eventType: ${eventType}`);
        query = query.where("eventType", "==", eventType);
      }
      if (startDate) {
        console.log(`Filtering by startDate: ${startDate}`);
        query = query.where("date", ">=", new Date(startDate));
      }
      if (endDate) {
        console.log(`Filtering by endDate: ${endDate}`);
        query = query.where("date", "<=", new Date(endDate));
      }

      console.log("Executing query...");
      const snapshot = await query.get();

      if (snapshot.empty) {
        console.warn("No events found matching the filters.");
        return res.status(204).send([]);
      }

      const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Filtered events fetched successfully:", events);
      res.status(200).send(events);
    } catch (error) {
      handleError(res, error, "filterEvents");
    }
  });
});
