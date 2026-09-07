"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/lib/supabase/client";

type Client = { id: string; name: string };
type Project = {
  id: string;
  company_id: string;
  name: string;
  location: string | null;
  status: string;
  contract_value: number;
  client_id: string | null;
  clients: { name: string }[] | null;
};
type Assignment = {
  id: string;
  employees: { name: string; job_title: string | null }[] | null;
};
type ProjectUpdate = {
  id: string;
  update_date: string;
  title: string;
  notes: string | null;
};
type ProjectFile = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number;
  created_at: string;
};
type ProjectExpense = {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  supplier: string | null;
  amount: number;
  payment_method: string | null;
  reference: string | null;
};

export function ProjectProfile({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [userId, setUserId] = useState("");
  const [editing, setEditing] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("Loading project…");

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setUserId(user.id);
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,company_id,name,location,status,contract_value,client_id,clients(name)",
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data)
      return setMessage(error?.message || "Project not found.");
    setProject(data as unknown as Project);
    const { data: clientData } = await supabase
      .from("clients")
      .select("id,name")
      .order("name");
    setClients((clientData ?? []) as Client[]);
    const { data: assignmentData } = await supabase
      .from("employee_assignments")
      .select("id,employees(name,job_title)")
      .eq("project_id", id)
      .eq("active", true);
    setAssignments((assignmentData ?? []) as unknown as Assignment[]);
    const { data: updateData, error: updateError } = await supabase
      .from("project_updates")
      .select("id,update_date,title,notes")
      .eq("project_id", id)
      .order("update_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (updateError) return setMessage(updateError.message);
    setUpdates((updateData ?? []) as ProjectUpdate[]);
    const { data: fileData, error: fileError } = await supabase
      .from("project_files")
      .select("id,file_name,storage_path,mime_type,file_size,created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    if (fileError) return setMessage(fileError.message);
    setFiles((fileData ?? []) as ProjectFile[]);
    const { data: expenseData, error: expenseError } = await supabase
      .from("project_expenses")
      .select(
        "id,expense_date,category,description,supplier,amount,payment_method,reference",
      )
      .eq("project_id", id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (expenseError) return setMessage(expenseError.message);
    setExpenses((expenseData ?? []) as ProjectExpense[]);
    setMessage("");
  }
  useEffect(() => {
    void load();
  }, [id]);

  async function save(formData: FormData) {
    if (!project) return;
    const { error } = await supabase
      .from("projects")
      .update({
        name: String(formData.get("name")),
        client_id: String(formData.get("client_id") || "") || null,
        location: String(formData.get("location") || ""),
        contract_value: Number(formData.get("contract_value") || 0),
        status: String(formData.get("status")),
      })
      .eq("id", project.id);
    if (error) return setMessage(error.message);
    setEditing(false);
    await load();
    setMessage("Project details saved successfully.");
  }

  async function saveUpdate(formData: FormData) {
    if (!project) return;
    const { error } = await supabase.from("project_updates").insert({
      company_id: project.company_id,
      project_id: project.id,
      update_date: String(formData.get("update_date")),
      title: String(formData.get("title")),
      notes: String(formData.get("notes") || "") || null,
    });
    if (error) return setMessage(error.message);
    setAddingUpdate(false);
    await load();
    setMessage("Project update saved successfully.");
  }

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project || !userId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("project_file");
    if (!(file instanceof File) || !file.size)
      return setMessage("Choose a file first.");
    if (file.size > 10 * 1024 * 1024)
      return setMessage("File must be 10 MB or smaller.");
    setUploading(true);
    setMessage("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${userId}/${project.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, file, { upsert: false });
    if (uploadError) {
      setUploading(false);
      return setMessage(uploadError.message);
    }
    const { error } = await supabase.from("project_files").insert({
      company_id: project.company_id,
      project_id: project.id,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
    });
    setUploading(false);
    if (error) return setMessage(error.message);
    formElement.reset();
    await load();
    setMessage("Project file uploaded successfully.");
  }

  async function openFile(file: ProjectFile) {
    const { data, error } = await supabase.storage
      .from("project-files")
      .createSignedUrl(file.storage_path, 3600);
    if (error) return setMessage(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function saveExpense(formData: FormData) {
    if (!project) return;
    const { error } = await supabase.from("project_expenses").insert({
      company_id: project.company_id,
      project_id: project.id,
      expense_date: String(formData.get("expense_date")),
      category: String(formData.get("category")),
      description: String(formData.get("description")),
      supplier: String(formData.get("supplier") || "") || null,
      amount: Number(formData.get("amount") || 0),
      payment_method: String(formData.get("payment_method") || "") || null,
      reference: String(formData.get("reference") || "") || null,
    });
    if (error) return setMessage(error.message);
    setAddingExpense(false);
    await load();
    setMessage("Project expense saved successfully.");
  }

  if (!project)
    return (
      <AppShell
        title="Project profile"
        description="Project details and site team."
      >
        <p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-800">
          {message}
        </p>
      </AppShell>
    );
  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const remainingBalance = Number(project.contract_value) - totalExpenses;
  return (
    <AppShell
      title="Project profile"
      description="Project details, client, updates and assigned team."
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href="/projects"
          className="text-sm font-semibold text-violet-700"
        >
          ← Back to projects
        </Link>
        {message && (
          <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {message}
          </p>
        )}
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          {editing ? (
            <form action={save}>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                Edit project
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Update project details
              </h2>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Project name
                  <input
                    required
                    name="name"
                    defaultValue={project.name}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Client
                  <select
                    name="client_id"
                    defaultValue={project.client_id ?? ""}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                  >
                    <option value="">No client selected</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Site location
                  <input
                    name="location"
                    defaultValue={project.location ?? ""}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Contract value (AED)
                  <input
                    type="number"
                    min="0"
                    name="contract_value"
                    defaultValue={project.contract_value}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Status
                  <select
                    name="status"
                    defaultValue={project.status}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In progress</option>
                    <option value="on_hold">On hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
              <div className="mt-8 flex gap-3">
                <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                  Save project details
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                    Saved project profile
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">{project.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {project.clients?.[0]?.name || "No client selected"}
                    {project.location ? ` · ${project.location}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Edit project details
                </button>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Contract value
                  </p>
                  <p className="mt-2 text-xl font-bold">
                    AED {Number(project.contract_value).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-xl font-bold capitalize">
                    {project.status.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Client
                  </p>
                  <p className="mt-2 text-xl font-bold">
                    {project.clients?.[0]?.name || "Not selected"}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                Project expenses
              </p>
              <h2 className="mt-2 text-xl font-bold">Site cost tracker</h2>
            </div>
            <button
              type="button"
              onClick={() => setAddingExpense(!addingExpense)}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
            >
              + Add expense
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Contract value
              </p>
              <p className="mt-2 text-lg font-bold">
                AED {Number(project.contract_value).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Total expenses
              </p>
              <p className="mt-2 text-lg font-bold">
                AED {totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Remaining balance
              </p>
              <p
                className={`mt-2 text-lg font-bold ${remainingBalance < 0 ? "text-red-600" : "text-emerald-700"}`}
              >
                AED {remainingBalance.toLocaleString()}
              </p>
            </div>
          </div>
          {addingExpense && (
            <form
              action={saveExpense}
              className="mt-5 grid gap-3 rounded-xl bg-violet-50 p-5 sm:grid-cols-2"
            >
              <label className="text-sm font-semibold">
                Expense date
                <input
                  required
                  name="expense_date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Category
                <select
                  required
                  name="category"
                  defaultValue="material"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                >
                  <option value="material">Material</option>
                  <option value="labour">Labour</option>
                  <option value="equipment">Equipment</option>
                  <option value="transport">Transport</option>
                  <option value="subcontractor">Subcontractor</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                Description
                <input
                  required
                  name="description"
                  placeholder="e.g. Cement and blocks"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Amount (AED)
                <input
                  required
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Supplier (optional)
                <input
                  name="supplier"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Payment method (optional)
                <select
                  name="payment_method"
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Receipt / reference (optional)
                <input
                  name="reference"
                  placeholder="Invoice or receipt number"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal"
                />
              </label>
              <div className="flex gap-3 sm:col-span-2">
                <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                  Save expense
                </button>
                <button
                  type="button"
                  onClick={() => setAddingExpense(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <div className="mt-5 space-y-3">
            {expenses.map((expense) => (
              <article
                key={expense.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{expense.description}</p>
                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {expense.category}
                    {expense.supplier ? ` · ${expense.supplier}` : ""}
                    {expense.reference ? ` · Ref: ${expense.reference}` : ""}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold">
                    AED {Number(expense.amount).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(
                      `${expense.expense_date}T00:00:00`,
                    ).toLocaleDateString("en-AE")}
                  </p>
                </div>
              </article>
            ))}
            {expenses.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No project expenses recorded yet.
              </p>
            )}
          </div>
        </section>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                Project files
              </p>
              <h2 className="mt-2 text-xl font-bold">
                Drawings, contracts and site photos
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Maximum 10 MB
            </span>
          </div>
          <form
            onSubmit={uploadFile}
            className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"
          >
            <input
              required
              name="project_file"
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-700"
            />
            <button
              disabled={uploading}
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload file"}
            </button>
          </form>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {files.map((file) => (
              <button
                type="button"
                key={file.id}
                onClick={() => void openFile(file)}
                className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50"
              >
                <p className="truncate font-semibold text-slate-900">
                  {file.file_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(Number(file.file_size) / 1024 / 1024).toFixed(2)} MB ·{" "}
                  {new Date(file.created_at).toLocaleDateString("en-AE")}
                </p>
              </button>
            ))}
            {files.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 sm:col-span-2">
                No files uploaded for this project yet.
              </p>
            )}
          </div>
        </section>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                Site updates
              </p>
              <h2 className="mt-2 text-xl font-bold">Daily project progress</h2>
            </div>
            <button
              onClick={() => setAddingUpdate(!addingUpdate)}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
            >
              + Add update
            </button>
          </div>
          {addingUpdate && (
            <form
              action={saveUpdate}
              className="mt-6 grid gap-3 rounded-xl bg-violet-50 p-5 sm:grid-cols-2"
            >
              <input
                required
                name="title"
                placeholder="Update title (e.g. Blockwork completed)"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
              <input
                required
                name="update_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
              <textarea
                name="notes"
                placeholder="Progress notes (optional)"
                className="min-h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:col-span-2"
              />
              <button className="w-fit rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                Save update
              </button>
            </form>
          )}
          <div className="mt-6 space-y-3">
            {updates.map((update) => (
              <article key={update.id} className="rounded-xl bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{update.title}</h3>
                  <time className="text-sm text-slate-500">
                    {new Date(
                      `${update.update_date}T00:00:00`,
                    ).toLocaleDateString("en-AE")}
                  </time>
                </div>
                {update.notes && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {update.notes}
                  </p>
                )}
              </article>
            ))}
            {updates.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No project updates yet. Add the first site progress note above.
              </p>
            )}
          </div>
        </section>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
                Site team
              </p>
              <h2 className="mt-2 text-xl font-bold">
                Employees assigned to this project
              </h2>
            </div>
            <Link
              href="/team"
              className="text-sm font-semibold text-violet-700"
            >
              Manage team →
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold">
                  {assignment.employees?.[0]?.name || "Employee"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {assignment.employees?.[0]?.job_title || "Team member"}
                </p>
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 sm:col-span-2">
                No employee is assigned yet. Use the Team page to assign
                employees to this project.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
