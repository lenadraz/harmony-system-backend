require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { database, container } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const participantRoutes = require("./routes/participants.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/test-db", async (req, res) => {
  try {
    const { resource } = await database.read();

    res.json({
      ok: true,
      message: "Database connected successfully",
      databaseId: resource.id,
      containerId: container.id,
    });
  } catch (error) {
    console.error("DB error:", error.message);

    res.status(500).json({
      ok: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Auth routes
app.use("/api/auth", authRoutes);

// Participant routes
app.use("/api/participants", participantRoutes);

// Test routes - אפשר למחוק אחר כך
app.get("/test-save", async (req, res) => {
  try {
    const { resource } = await container.item("p1", "event1").read();

    resource.saved = resource.saved || [];

    if (!resource.saved.includes("p2")) {
      resource.saved.push("p2");
    }

    const { resource: updated } = await container
      .item("p1", "event1")
      .replace(resource);

    res.json({
      message: "Test save worked",
      saved: updated.saved,
    });
  } catch (error) {
    res.status(500).json({
      message: "Test save failed",
      error: error.message,
    });
  }
});

app.get("/test-unsave", async (req, res) => {
  try {
    const { resource } = await container.item("p1", "event1").read();

    resource.saved = (resource.saved || []).filter((item) => item !== "p2");

    const { resource: updated } = await container
      .item("p1", "event1")
      .replace(resource);

    res.json({
      message: "Test unsave worked",
      saved: updated.saved,
    });
  } catch (error) {
    res.status(500).json({
      message: "Test unsave failed",
      error: error.message,
    });
  }
});

app.get("/test-met", async (req, res) => {
  try {
    const { resource } = await container.item("p1", "event1").read();

    resource.met = resource.met || [];

    if (!resource.met.includes("p2")) {
      resource.met.push("p2");
    }

    const { resource: updated } = await container
      .item("p1", "event1")
      .replace(resource);

    res.json({
      message: "Test met worked",
      met: updated.met,
    });
  } catch (error) {
    res.status(500).json({
      message: "Test met failed",
      error: error.message,
    });
  }
});

app.get("/test-unmet", async (req, res) => {
  try {
    const { resource } = await container.item("p1", "event1").read();

    resource.met = (resource.met || []).filter((item) => item !== "p2");

    const { resource: updated } = await container
      .item("p1", "event1")
      .replace(resource);

    res.json({
      message: "Test unmet worked",
      met: updated.met,
    });
  } catch (error) {
    res.status(500).json({
      message: "Test unmet failed",
      error: error.message,
    });
  }
});
// ===== SAVE =====
app.post("/api/save", async (req, res) => {
  try {
    const { userId, targetId, remove } = req.body;

    const { resource } = await container.item(userId, "event1").read();

    let userDoc = resource;

    if (!userDoc) {
      userDoc = {
        id: userId,
        event_id: "event1",
        saved: [],
        met: [],
      };
    }

    userDoc.saved = userDoc.saved || [];

    if (remove) {
      userDoc.saved = userDoc.saved.filter(id => String(id) !== String(targetId));
    } else {
      if (!userDoc.saved.map(String).includes(String(targetId))) {
        userDoc.saved.push(String(targetId));
      }
    }

    let updated;

    if (resource) {
      ({ resource: updated } = await container.item(userId, "event1").replace(userDoc));
    } else {
      ({ resource: updated } = await container.items.create(userDoc));
    }

    res.json({ saved: updated.saved });
  } catch (error) {
    res.status(500).json({
      message: "Save failed",
      error: error.message,
    });
  }
});

// ===== MET =====
app.post("/api/met", async (req, res) => {
  try {
    const { userId, targetId, remove } = req.body;

    const { resource } = await container.item(userId, "event1").read();

    let userDoc = resource;

    if (!userDoc) {
      userDoc = {
        id: userId,
        event_id: "event1",
        saved: [],
        met: [],
      };
    }

    userDoc.met = userDoc.met || [];

    if (remove) {
      userDoc.met = userDoc.met.filter(id => String(id) !== String(targetId));
    } else {
      if (!userDoc.met.map(String).includes(String(targetId))) {
        userDoc.met.push(String(targetId));
      }
    }

    let updated;

    if (resource) {
      ({ resource: updated } = await container.item(userId, "event1").replace(userDoc));
    } else {
      ({ resource: updated } = await container.items.create(userDoc));
    }

    res.json({ met: updated.met });
  } catch (error) {
    res.status(500).json({
      message: "Met failed",
      error: error.message,
    });
  }
});

// ===== GET SAVED =====
app.get("/api/saved/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const { resource } = await container.item(userId, "event1").read();

    if (!resource) {
      return res.json([]);
    }

    res.json(resource.saved || []);
  } catch (error) {
    res.status(500).json({
      message: "Fetch saved failed",
      error: error.message,
    });
  }
});

// ===== GET MET =====
app.get("/api/met/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const { resource } = await container.item(userId, "event1").read();

    if (!resource) {
      return res.json([]);
    }

    res.json(resource.met || []);
  } catch (error) {
    res.status(500).json({
      message: "Fetch met failed",
      error: error.message,
    });
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});