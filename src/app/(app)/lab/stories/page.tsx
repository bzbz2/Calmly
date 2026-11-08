import { notFound } from "next/navigation";
import StoryLab from "@/components/story/StoryLab";

// Dev-only gallery for reviewing story scenes (art, pacing, intensity).
export default function StoriesLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StoryLab />;
}
