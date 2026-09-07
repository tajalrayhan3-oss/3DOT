"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  trn: string | null;
  address: string | null;
  website: string | null;
  status: string;
};
type Project = {
  id: string;
  name: string;
  location: string | null;
  status: string;
  contract_value: number;
  clients: { name: string }[] | null;
};

export function CompanyResource({ type }: { type: "clients" | "projects" }) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectProgress, setProjectProgress] = useState<
    Record<string, { total: number; completed: number }>
  >({});
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const isClients = type === "clients";

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setMessage("Please sign in to manage your workspace.");
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!company)
      return setMessage("Complete company setup before adding records.");
    setCompanyId(company.id);
    const clientsResult = await supabase
      .from("clients")
      .select("id,name,contact_name,email,phone,trn,address,website,status")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    setClients((clientsResult.data ?? []) as Client[]);
    if (!isClients) {
      const [projectsResult, tasksResult] = await Promise.all([
        supabase
          .from("projects")
          .select("id,name,location,status,contract_value,clients(name)")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("project_tasks")
          .select("project_id,status")
          .eq("company_id", company.id),
      ]);
      if (projectsResult.error || tasksResult.error)
        return setMessage(
          (projectsResult.error || tasksResult.error)?.message ||
            "Could not load projects.",
        );
      setProjects((projectsResult.data ?? []) as unknown as Project[]);
      const progress: Record<string, { total: number; completed: number }> = {};
      for (const task of tasksResult.data ?? []) {
        progress[task.project_id] ??= { total: 0, completed: 0 };
        progress[task.project_id].total += 1;
        if (task.status === "completed")
          progress[task.project_id].completed += 1;
      }
      setProjectProgress(progress);
    }
  }
  useEffect(() => {
    load();
  }, [isClients]);

  async function create(formData: FormData) {
    if (!companyId) return;
    const result = isClients
      ? await supabase.from("clients").insert({
          company_id: companyId,
          name: String(formData.get("name")),
          contact_name: String(formData.get("contact") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          trn: String(formData.get("trn") || ""),
          address: String(formData.get("address") || ""),
          website: String(formData.get("website") || ""),
          status: String(formData.get("status")),
        })
      : await supabase.from("projects").insert({
          company_id: companyId,
          client_id: String(formData.get("client_id") || "") || null,
          name: String(formData.get("name")),
          location: String(formData.get("location") || ""),
          status: String(formData.get("status")),
          contract_value: Number(formData.get("contract_value") || 0),
        });
    const { error } = result;
    if (error) return setMessage(error.message);
    setOpen(false);
    setMessage("");
    await load();
  }

  async function updateStatus(id: string, status: string) {
    setMessage("");
    const { error } = await supabase.from(type).update({ status }).eq("id", id);
    if (error) return setMessage(error.message);
    await load();
  }

  const title = isClients ? "Clients" : "Projects";
  const query = search.trim().toLowerCase();
  const visibleClients = clients.filter((client) =>
    [client.name, client.contact_name, client.email, client.phone, client.trn]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  const visibleProjects = projects.filter((project) =>
    [project.name, project.location, project.clients?.[0]?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  return (
    <AppShell
      title={title}
      description={
        isClients
          ? "Keep every client contact and account in one place."
          : "Track jobs from quotation through handover."
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {isClients
            ? `${clients.length} client${clients.length === 1 ? "" : "s"}`
            : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          + {isClients ? "Add client" : "New project"}
        </button>
      </div>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={`Search ${title.toLowerCase()}...`}
        className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"
      />
      {message && (
        <div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">
          {message}{" "}
          {message.includes("setup") && (
            <Link href="/onboarding" className="font-bold underline">
              Open setup
            </Link>
          )}
        </div>
      )}
      {open && (
        <form
          action={create}
          className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6"
        >
          <h2 className="text-lg font-bold">
            {isClients ? "Add a client" : "Create a project"}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              required
              name="name"
              placeholder={isClients ? "Client company name" : "Project name"}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3"
            />
            {isClients ? (
              <>
                <input
                  name="contact"
                  placeholder="Contact person"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Company email"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  name="phone"
                  placeholder="Company phone"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  name="trn"
                  placeholder="TRN / VAT number (optional)"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  name="website"
                  placeholder="Website (optional)"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <textarea
                  name="address"
                  placeholder="Company address (optional)"
                  className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 sm:col-span-2"
                />
              </>
            ) : (
              <>
                <select
                  name="client_id"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="">No client selected</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <input
                  name="location"
                  placeholder="Site location"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  type="number"
                  min="0"
                  name="contract_value"
                  placeholder="Contract value (AED)"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                />
              </>
            )}
            <select
              name="status"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value={isClients ? "active" : "planning"}>
                {isClients ? "Active" : "Planning"}
              </option>
              <option value={isClients ? "lead" : "in_progress"}>
                {isClients ? "Lead" : "In progress"}
              </option>
              <option value={isClients ? "inactive" : "on_hold"}>
                {isClients ? "Inactive" : "On hold"}
              </option>
            </select>
          </div>
          <button className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            Save
          </button>
        </form>
      )}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isClients
          ? visibleClients.map((client) => (
              <article
                key={client.id}
                className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"
              >
                <div>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-semibold text-slate-950 hover:text-violet-700"
                  >
                    {client.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {client.contact_name || "No contact"}
                    {client.email ? ` · ${client.email}` : ""}
                    {client.trn ? ` · TRN: ${client.trn}` : ""}
                  </p>
                </div>
                <select
                  aria-label={`${client.name} status`}
                  value={client.status}
                  onChange={(event) =>
                    void updateStatus(client.id, event.target.value)
                  }
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700"
                >
                  <option value="lead">lead</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </article>
            ))
          : visibleProjects.map((project) => (
              <article
                key={project.id}
                className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 last:border-0"
              >
                <div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-semibold text-slate-950 hover:text-violet-700"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {project.clients?.[0]?.name || "No client"}
                    {project.location ? ` · ${project.location}` : ""}
                  </p>
                  {projectProgress[project.id]?.total ? (
                    <div className="mt-3 w-52 max-w-full">
                      <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
                        <span>Task progress</span>
                        <span>
                          {Math.round(
                            (projectProgress[project.id].completed /
                              projectProgress[project.id].total) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-violet-600"
                          style={{
                            width: `${Math.round((projectProgress[project.id].completed / projectProgress[project.id].total) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      No tasks added
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <select
                    aria-label={`${project.name} status`}
                    value={project.status}
                    onChange={(event) =>
                      void updateStatus(project.id, event.target.value)
                    }
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700"
                  >
                    <option value="planning">planning</option>
                    <option value="in_progress">in progress</option>
                    <option value="on_hold">on hold</option>
                    <option value="completed">completed</option>
                  </select>
                  <p className="mt-2 text-sm font-semibold">
                    AED {Number(project.contract_value).toLocaleString()}
                  </p>
                </div>
              </article>
            ))}
        {((isClients && visibleClients.length === 0) ||
          (!isClients && visibleProjects.length === 0)) && (
          <p className="p-8 text-center text-sm text-slate-500">
            {search
              ? `No ${title.toLowerCase()} match your search.`
              : `No ${title.toLowerCase()} yet. Use the button above to add one.`}
          </p>
        )}
      </section>
    </AppShell>
  );
}
