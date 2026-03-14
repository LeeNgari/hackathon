import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCourse, type CreateCoursePayload } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import type { CourseCategory, Difficulty } from "@/lib/domain-types";

const CATEGORIES: CourseCategory[] = ["Tech", "Business", "Design", "Finance"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export default function InstructorCourseCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCourse = useCreateCourse();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CourseCategory>("Tech");
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const [feeAmount, setFeeAmount] = useState<string>("1000");
  const [companyPartner, setCompanyPartner] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Title required",
        description: "Please enter a course title.",
        variant: "destructive",
      });
      return;
    }
    const fee = Number(feeAmount);
    if (Number.isNaN(fee) || fee < 0) {
      toast({
        title: "Invalid fee",
        description: "Please enter a valid fee amount (KES).",
        variant: "destructive",
      });
      return;
    }

    const payload: CreateCoursePayload = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      category,
      difficulty,
      fee_amount: fee,
      company_partner: companyPartner.trim() || null,
    };

    try {
      const created = await createCourse.mutateAsync(payload);
      toast({
        title: "Course created",
        description: "Your course has been saved as a draft. Add sprints and tickets, then submit for review.",
      });
      setLocation(`/instructor/courses/${created.id}`);
    } catch (err) {
      toast({
        title: "Failed to create course",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Create course</h1>
            <p className="text-slate-500 mt-1">Add a new course as a draft, then add sprints and tickets.</p>
          </div>
          <Button variant="ghost" size="sm" className="w-fit" asChild>
            <Link href="/instructor/courses">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Courses
            </Link>
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Course details</CardTitle>
              <p className="text-sm text-slate-500 font-normal">Basic info students will see in the catalog.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Title</Label>
                  <Input
                    id="course-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Cloud Infrastructure Fundamentals"
                    className="w-full"
                    required
                    disabled={createCourse.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-description">Description (optional)</Label>
                  <Textarea
                    id="course-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the course"
                    className="min-h-[100px] resize-y"
                    disabled={createCourse.isPending}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v as CourseCategory)}
                      disabled={createCourse.isPending}
                    >
                      <SelectTrigger id="course-category" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={difficulty}
                      onValueChange={(v) => setDifficulty(v as Difficulty)}
                      disabled={createCourse.isPending}
                    >
                      <SelectTrigger id="course-difficulty" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-fee">Fee (KES)</Label>
                  <Input
                    id="course-fee"
                    type="number"
                    min={0}
                    step={100}
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder="1000"
                    disabled={createCourse.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-partner">Company partner (optional)</Label>
                  <Input
                    id="course-partner"
                    value={companyPartner}
                    onChange={(e) => setCompanyPartner(e.target.value)}
                    placeholder="e.g. AWS Partner"
                    disabled={createCourse.isPending}
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <Button type="submit" disabled={createCourse.isPending} className="sm:min-w-[140px]">
                    {createCourse.isPending ? "Creating…" : "Create course"}
                  </Button>
                  <Button type="button" variant="outline" disabled={createCourse.isPending} asChild>
                    <Link href="/instructor/courses">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </InstructorLayout>
  );
}
