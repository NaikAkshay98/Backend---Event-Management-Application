const Joi = require("joi");

// Schema for creating a new event
const eventSchema = Joi.object({
  title: Joi.string().required(), // Event title is mandatory
  eventType: Joi.string()
    .valid("Conference", "Meetup", "Workshop", "Webinar")
    .required(), // Must be one of the predefined event types
  date: Joi.date().iso().required(), // Date must be in ISO format
  location: Joi.string().required(), // Location is mandatory
  description: Joi.string().optional(), // Description is optional
  organizer: Joi.string().required(), // Organizer name is mandatory
});

// Schema for updating an existing event
const updateEventSchema = Joi.object({
  id: Joi.string().required(), // Event ID is mandatory for updates
  title: Joi.string().optional(), // Title can be updated if provided
  eventType: Joi.string()
    .valid("Conference", "Meetup", "Workshop", "Webinar")
    .optional(), // Event type can be updated if provided
  date: Joi.date().iso().optional(), // Date can be updated if provided
  location: Joi.string().optional(), // Location can be updated if provided
  description: Joi.string().optional(), // Description can be updated if provided
  organizer: Joi.string().optional(), // Organizer can be updated if provided
});

// Schema for deleting an event
const deleteEventSchema = Joi.object({
  id: Joi.string().required(), // Event ID is mandatory for deletion
});

// Schema for retrieving an event by its ID
const getEventByIdSchema = Joi.object({
  id: Joi.string().required(), // Event ID is mandatory to retrieve details
});

// Schema for filtering events
const filterEventsSchema = Joi.object({
  eventType: Joi.string()
    .valid("Conference", "Meetup", "Workshop", "Webinar")
    .optional(), // Event type is optional for filtering
  startDate: Joi.date().iso().optional(), // Start date filter (optional)
  endDate: Joi.date().iso().optional(), // End date filter (optional)
});

module.exports = {
  eventSchema,
  updateEventSchema,
  deleteEventSchema,
  getEventByIdSchema,
  filterEventsSchema,
};
