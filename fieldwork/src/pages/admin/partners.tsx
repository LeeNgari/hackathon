import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, User, Search, CheckCircle2, Clock } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { partners } from "@/lib/admin-data";

export default function AdminPartners() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = partners.filter(p => {
    if (typeFilter !== "All" && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = partners.filter(p => p.status === "Active").length;
  const pendingCount = partners.filter(p => p.status === "Pending").length;
  const instructorCount = partners.filter(p => p.type === "Instructor").length;
  const companyCount = partners.filter(p => p.type === "Company").length;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-slate-900">Partner Management</h1>
          <p className="text-slate-500 mt-1">Manage instructors and company partners contributing courses to Fieldwork.</p>
        </motion.div>

        {/* Summary cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Partners", value: partners.length, icon: User, color: "bg-blue-100 text-blue-600" },
            { label: "Instructors", value: instructorCount, icon: User, color: "bg-purple-100 text-purple-600" },
            { label: "Companies", value: companyCount, icon: Building2, color: "bg-amber-100 text-amber-600" },
            { label: "Pending Approval", value: pendingCount, icon: Clock, color: "bg-red-100 text-red-600" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList className="bg-white border border-slate-200">
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Instructor">Instructors</TabsTrigger>
              <TabsTrigger value="Company">Companies</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search partners..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Partner cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(partner => (
            <Card key={partner.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${partner.type === "Instructor" ? "bg-purple-100 text-purple-600" : "bg-amber-100 text-amber-600"}`}>
                      {partner.type === "Instructor" ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{partner.name}</h3>
                      <p className="text-xs text-slate-500">Joined {partner.joinDate} · {partner.category}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={partner.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-xs"
                      : partner.status === "Pending"
                        ? "bg-amber-50 text-amber-700 border-amber-100 text-xs"
                        : "bg-slate-100 text-slate-500 text-xs"}
                  >
                    {partner.status === "Active" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {partner.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900">{partner.courses}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900">{partner.students.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Students</p>
                  </div>
                  <div className="text-center">
                    {partner.type === "Instructor" && partner.totalPaid > 0 ? (
                      <>
                        <p className="text-xl font-bold text-emerald-700">KES {(partner.totalPaid / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-slate-500 mt-0.5">Paid Out</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-slate-400">—</p>
                        <p className="text-xs text-slate-500 mt-0.5">Paid Out</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
