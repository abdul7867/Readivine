import mongoose, { Schema } from 'mongoose';

const readmeSchema = new Schema(
  {
    repoFullName: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Create a reference to the User who owns this README
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only have one saved README per repository
readmeSchema.index({ repoFullName: 1, owner: 1 }, { unique: true });

export const Readme = mongoose.model('Readme', readmeSchema);
