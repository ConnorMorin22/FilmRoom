import { useMemo, useState } from "react";
import { Instructor } from "@/api/entities";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const emptyForm = {
  name: "",
  slug: "",
  photo_url: "",
  headline: "",
  bio: "",
  position: "",
  credential_line: "",
  school: "",
  pro_team: "",
  honors: "",
  instagram_url: "",
  twitter_url: "",
  youtube_url: "",
  tiktok_url: "",
  is_featured: false,
  is_active: true,
};

function Editor({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        honors: form.honors
          ? form.honors.split(",").map((h) => h.trim()).filter(Boolean)
          : [],
      };
      if (isEdit) {
        await Instructor.update(initial.id, payload);
      } else {
        await Instructor.create(payload);
      }
      onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-slate-900/70 border-slate-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white">{isEdit ? "Edit Instructor" : "Add Instructor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Name" className="bg-slate-800 border-slate-600 text-white" required />
            <Input value={form.position} onChange={(e) => setField("position", e.target.value)} placeholder="Position (Attack, Goalie...)" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.school} onChange={(e) => setField("school", e.target.value)} placeholder="School" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.pro_team} onChange={(e) => setField("pro_team", e.target.value)} placeholder="Pro team" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.headline} onChange={(e) => setField("headline", e.target.value)} placeholder="Headline (optional)" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.credential_line} onChange={(e) => setField("credential_line", e.target.value)} placeholder="Credential line" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.photo_url} onChange={(e) => setField("photo_url", e.target.value)} placeholder="Photo URL" className="bg-slate-800 border-slate-600 text-white md:col-span-2" />
            <Input value={form.honors} onChange={(e) => setField("honors", e.target.value)} placeholder="Honors (comma-separated)" className="bg-slate-800 border-slate-600 text-white md:col-span-2" />
            <Input value={form.instagram_url} onChange={(e) => setField("instagram_url", e.target.value)} placeholder="Instagram URL" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.twitter_url} onChange={(e) => setField("twitter_url", e.target.value)} placeholder="X/Twitter URL" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.youtube_url} onChange={(e) => setField("youtube_url", e.target.value)} placeholder="YouTube URL" className="bg-slate-800 border-slate-600 text-white" />
            <Input value={form.tiktok_url} onChange={(e) => setField("tiktok_url", e.target.value)} placeholder="TikTok URL" className="bg-slate-800 border-slate-600 text-white" />
          </div>
          <Textarea value={form.bio} onChange={(e) => setField("bio", e.target.value)} placeholder="Bio" className="bg-slate-800 border-slate-600 text-white h-24" />
          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <Checkbox checked={form.is_featured} onCheckedChange={(v) => setField("is_featured", Boolean(v))} />
              Featured
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <Checkbox checked={form.is_active} onCheckedChange={(v) => setField("is_active", Boolean(v))} />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600 text-slate-300">
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-1" /> {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function InstructorManager({ instructors, onRefresh }) {
  const [editor, setEditor] = useState(null);
  const sorted = useMemo(
    () => [...(instructors || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [instructors]
  );

  const onDelete = async (instructor) => {
    const ok = window.confirm(`Deactivate/delete ${instructor.name}?`);
    if (!ok) return;
    await Instructor.delete(instructor.id);
    onRefresh();
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Instructor Management</CardTitle>
        <Button onClick={() => setEditor(emptyForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Instructor
        </Button>
      </CardHeader>
      <CardContent>
        {editor && (
          <Editor
            initial={editor?.id ? editor : null}
            onCancel={() => setEditor(null)}
            onSaved={() => {
              setEditor(null);
              onRefresh();
            }}
          />
        )}
        <div className="space-y-3">
          {sorted.map((ins) => (
            <div key={ins.id} className="rounded-lg border border-slate-700 p-4 bg-slate-900/40">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="text-white font-semibold">{ins.name}</div>
                  <div className="text-sm text-cyan-300">{ins.position || ins.headline || "Instructor"}</div>
                  <div className="text-xs text-slate-400 mt-1">{ins.credential_line || ins.bio || "No bio yet."}</div>
                  <div className="mt-2 flex gap-2">
                    {ins.is_featured && <Badge className="bg-amber-600">Featured</Badge>}
                    <Badge className={ins.is_active ? "bg-green-700" : "bg-slate-700"}>{ins.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditor(ins)} className="text-slate-300 hover:text-blue-400">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(ins)} className="text-slate-300 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

