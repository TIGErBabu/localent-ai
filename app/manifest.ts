import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Localent.ai — Local pros, protected payments",
    short_name: "Localent",
    description: "Two-sided home-services marketplace with milestone escrow payments.",
    start_url: "/dashboard/pro",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1E3A8A",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
