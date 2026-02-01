
import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        // Bookmarks will store the full listing object for simplicity
        bookmarks: { type: Array, default: [] },
    },
    { timestamps: true }
);

// Prevent overwriting the model if it's already compiled
const User = models.User || model("User", UserSchema);

export default User;
