import { redirect } from "next/navigation";

export default function NewContactPage() {
  redirect("/company/contacts?create=1");
}
