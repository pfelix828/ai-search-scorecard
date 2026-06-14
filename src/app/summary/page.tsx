import { redirect } from "next/navigation";

// The executive summary is now the home page. Keep this route as a permanent
// redirect so older links (bookmarks, the portfolio site) still resolve.
export default function SummaryRedirect() {
  redirect("/");
}
