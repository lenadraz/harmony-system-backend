const express = require("express");
const router = express.Router();
const { container } = require("../config/db");

function normalizePhone(value) {
  if (!value) return "";

  let s = String(value).trim();

  if (s.endsWith(".0")) {
    s = s.slice(0, -2);
  }

  s = s.replace(/[^\d+]/g, "");

  if (s.startsWith("+972")) {
    s = "0" + s.slice(4);
  } else if (s.startsWith("972")) {
    s = "0" + s.slice(3);
  }

  if (s.length === 9 && !s.startsWith("0")) {
    s = "0" + s;
  }

  return s;
}

router.post("/phone-login", async (req, res) => {
  try {
    const phone = req.body.phone || req.body.phoneNumber;
    const eventId = req.body.eventId;

    if (!phone) {
      return res.status(400).json({
        message: "phone is required",
      });
    }

    if (!eventId) {
      return res.status(400).json({
        message: "eventId is required",
      });
    }

    const normalizedPhone = normalizePhone(phone);

    const querySpec = {
      query: `
        SELECT TOP 1 * FROM c
        WHERE c.eventId = @eventId
        AND c.phoneNumber = @phoneNumber
      `,
      parameters: [
        { name: "@eventId", value: eventId },
        { name: "@phoneNumber", value: normalizedPhone },
      ],
    };

    const { resources } = await container.items
      .query(querySpec, { enableCrossPartitionQuery: true })
      .fetchAll();

    let participant = resources[0];

    if (!participant) {
      const allQuery = {
        query: "SELECT * FROM c WHERE c.eventId = @eventId",
        parameters: [{ name: "@eventId", value: eventId }],
      };

      const { resources: allParticipants } = await container.items
        .query(allQuery, { enableCrossPartitionQuery: true })
        .fetchAll();

      participant = allParticipants.find(
        (p) =>
          p.eventId === eventId &&
          normalizePhone(p.phoneNumber) === normalizedPhone
      );
    }

    if (!participant) {
      return res.status(404).json({
        message: "Participant not found for this event",
      });
    }

    return res.json({
      ok: true,
      participantId: participant.id,
      docId: participant.id,
      eventId: participant.eventId,
      phoneNumber: normalizePhone(participant.phoneNumber),
      name: participant.name || "",
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
