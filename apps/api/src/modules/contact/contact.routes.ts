import { Router } from "express";

import { validateRequest } from "../../middleware/validateRequest.js";
import { submitContactController } from "./contact.controller.js";
import { contactMessageSchema } from "./contact.schema.js";

const contactRouter = Router();

contactRouter.post(
  "/",
  validateRequest(contactMessageSchema),
  submitContactController,
);

export default contactRouter;
