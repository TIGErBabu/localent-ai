import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/actions";
import { db } from "@/lib/store";

export default async function Header() {
  const user = await getSessionUser();
  const unread = user ? db().notifications.filter((x) => x.userId === user.id && !x.read).length : 0;
  const dash = user?.role === "ADMIN" ? "/admin" : user?.role === "PRO" ? "/dashboard/pro" : "/dashboard/customer";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-trust">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-trust text-lg text-white">L</span>
          <span className="text-lg">Localent<span className="text-action-dark">.ai</span></span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <Link href="/directory" className="hover:text-trust">Find a pro</Link>
          <Link href="/services/plumbing" className="hover:text-trust">Plumbing</Link>
          <Link href="/services/electrical" className="hover:text-trust">Electrical</Link>
          <Link href="/services/handyman" className="hover:text-trust">Handyman</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={dash} className="btn-trust !min-h-[40px] px-3 py-2 text-sm">
                {user.name.split(" ")[0]}’s dashboard{unread ? ` (${unread})` : ""}
              </Link>
              <form action={logoutAction}><button className="btn-ghost !min-h-[40px] px-3 py-2 text-sm" type="submit">Log out</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !min-h-[40px] px-3 py-2 text-sm">Log in</Link>
              <Link href="/register/customer" className="btn-action !min-h-[40px] px-3 py-2 text-sm">Post a job</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
