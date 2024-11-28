const { db, admin } = require("../utils/firebase");
const { FieldValue } = admin.firestore;
const { handleError } = require("../utils/errorHandler");
const { validateInput } = require("../utils/validationHelper");
const {
  eventSchema,
  updateEventSchema,
  deleteEventSchema,
  getEventByIdSchema,
  filterEventsSchema,
} = require("../utils/validationSchemas");

// Create a new event and store it in the Firestore database
const createEvent = async (req, res) => {
  // Validate the request body against the event schema
  const isValid = validateInput(req.body, eventSchema, res);
  if (!isValid) return;

  try {
    const eventData = req.body;

    const event = {
      ...eventData,
      createdAt: FieldValue.serverTimestamp(), // Add server timestamp for creation
      updatedAt: FieldValue.serverTimestamp(), // Add server timestamp for last update
    };

    const docRef = await db.collection("events").add(event);
    console.log(`Event created successfully with ID: ${docRef.id}`);
    res.status(201).send({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error creating event:", error);
    handleError(res, error, "createEvent");
  }
};

// Retrieve all events from the Firestore database
const getAllEvents = async (req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    if (snapshot.empty) {
      console.log("No events found");
      return res.status(204).send([]); // No Content
    }

    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`Retrieved ${events.length} events`);
    res.status(200).send(events);
  } catch (error) {
    console.error("Error fetching all events:", error);
    handleError(res, error, "getAllEvents");
  }
};

// Retrieve a specific event by its ID
const getEventById = async (req, res) => {
  // Validate the query parameters against the schema
  const isValid = validateInput(req.query, getEventByIdSchema, res);
  if (!isValid) return;

  try {
    const { id } = req.query;
    const eventDoc = await db.collection("events").doc(id).get();

    if (!eventDoc.exists) {
      console.log(`Event with ID ${id} not found`);
      return res.status(404).send({ success: false, message: "Event not found" });
    }

    console.log(`Event with ID ${id} retrieved successfully`);
    res.status(200).send({ id: eventDoc.id, ...eventDoc.data() });
  } catch (error) {
    console.error(`Error fetching event with ID ${req.query.id}:`, error);
    handleError(res, error, "getEventById");
  }
};

// Update an existing event by its ID
const updateEvent = async (req, res) => {
  // Validate the request body against the update event schema
  const isValid = validateInput(req.body, updateEventSchema, res);
  if (!isValid) return;

  try {
    const { id, ...eventData } = req.body;
    await db.collection("events").doc(id).update({
      ...eventData,
      updatedAt: FieldValue.serverTimestamp(), // Update the timestamp for modification
    });

    console.log(`Event with ID ${id} updated successfully`);
    res.status(200).send({ success: true, message: "Event updated successfully" });
  } catch (error) {
    console.error(`Error updating event with ID ${req.body.id}:`, error);
    handleError(res, error, "updateEvent");
  }
};

// Delete an event by its ID
const deleteEvent = async (req, res) => {
  // Validate the query parameters against the delete event schema
  const isValid = validateInput(req.query, deleteEventSchema, res);
  if (!isValid) return;

  try {
    const { id } = req.query;
    await db.collection("events").doc(id).delete();

    console.log(`Event with ID ${id} deleted successfully`);
    res.status(200).send({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error(`Error deleting event with ID ${req.query.id}:`, error);
    handleError(res, error, "deleteEvent");
  }
};

// Filter events based on type and date range
const filterEvents = async (req, res) => {
  // Validate the query parameters against the filter events schema
  const isValid = validateInput(req.query, filterEventsSchema, res);
  if (!isValid) return;

  try {
    const { eventType, startDate, endDate } = req.query;
    let query = db.collection("events");

    // Apply filters if they exist
    if (eventType) {
      console.log(`Filtering events by type: ${eventType}`);
      query = query.where("eventType", "==", eventType);
    }
    if (startDate) {
      console.log(`Filtering events with start date >= ${startDate}`);
      query = query.where("date", ">=", new Date(startDate));
    }
    if (endDate) {
      console.log(`Filtering events with end date <= ${endDate}`);
      query = query.where("date", "<=", new Date(endDate));
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      console.log("No events match the filter criteria");
      return res.status(204).send([]); // No Content
    }

    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`Filtered ${events.length} events`);
    res.status(200).send(events);
  } catch (error) {
    console.error("Error filtering events:", error);
    handleError(res, error, "filterEvents");
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  filterEvents,
};
