import { database, logger } from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getEventarc } from "firebase-admin/eventarc";

const app = initializeApp();
// Listens for new messages added to /messages/{pushId}/original and creates an
// uppercase version of the message to /messages/{pushId}/uppercase
// for all databases in 'us-central1'
export const makeuppercase = database.ref(process.env.MESSAGE_PATH).onCreate(
  async (snapshot, context) => {
    logger.log("Found new message at ", snapshot.ref);
    // Grab the current value of what was written to the Realtime Database.
    const original = snapshot.val();

    // Convert it to upper case.
    logger.log("Uppercasing", context.params.pushId, original);
    const uppercase = original.toUpperCase();

    // Setting an "uppercase" sibling in the Realtime Database.
    const upperRef = snapshot.ref.parent.child("upper");
    await upperRef.set(uppercase);

    // Set eventChannel to a newly-initialized channel, or `undefined` if events
    // aren't enabled.
    const eventChannel =
      process.env.EVENTARC_CHANNEL &&
      getEventarc().channel(process.env.EVENTARC_CHANNEL, {
        allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
      });

    // If events are enabled, publish a `complete` event to the configured
    // channel.
    eventChannel &&
      eventChannel.publish({
        type: "test-publisher.rtdb-uppercase-messages.v1.complete",
        subject: upperRef.toString(),
        data: {
          "original": original,
          "uppercase": uppercase,
        },
      });
  });