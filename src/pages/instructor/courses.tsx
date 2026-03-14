import { motion } from "framer-motion";
import { Link } from "wouter";
import { Users, TicketCheck, Star, Building2, ArrowRight, Plus, BookOpen } from "lucide-react";
import { InstructorLayout } from "@/components/layout/instructor-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
export default function InstructorCourses() {
  const instructorCourses: { id: string; title: string; category: string; difficulty: string; status: string; studentsEnrolled: number; sprints: number; tickets: number; completionRate: number; avgRating: number; earnedToDate: number; companyPartner: string | null }[] = [];
  const isLoading = false;
  return (
    <InstructorLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">My Courses</h1>
            <p className="text-slate-500 mt-1">All courses you've published or are building on Fieldwork.</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/instructor/courses/new">
              <Plus className="w-4 h-4 mr-2" /> Create course
            </Link>
          </Button>
        </motion.div>

        {!isLoading && instructorCourses.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-display font-bold text-slate-900 mb-2">No courses yet</h2>
                <p className="text-slate-500 max-w-sm mb-6">Create your first course to start publishing sprints and work tickets for students.</p>
                <Button asChild>
                  <Link href="/instructor/courses/new">
                    <Plus className="w-4 h-4 mr-2" /> Create your first course
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-6">
          {instructorCourses.map(course => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden hover:cursor-pointer">
                <div className={`h-1.5 ${course.status === "Live" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : course.status === "Draft" ? "bg-slate-200" : "bg-gradient-to-r from-amber-400 to-amber-600"}`} />
                <CardContent className="p-6 md:p-8">
                  <Link href={`/instructor/courses/${course.id}`} className="block">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">{course.category}</Badge>
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">{course.difficulty}</Badge>
                          <Badge variant="outline" className={`text-xs ${
                            course.status === "Live" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            course.status === "Draft" ? "bg-slate-100 text-slate-500" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {course.status}
                          </Badge>
                          {course.companyPartner && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-xs inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {course.companyPartner}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-display font-bold text-slate-900">{course.title}</h2>
                        <p className="text-slate-500 mt-1">{course.sprints} Sprints · {course.tickets} Work Tickets</p>
                      </div>

                      {course.status === "Live" && course.avgRating > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <span className="text-xl font-bold text-amber-700">{course.avgRating}</span>
                        </div>
                      )}
                    </div>

                    {course.status === "Live" && (
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{course.studentsEnrolled}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Students</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <TicketCheck className="w-4 h-4 text-slate-400" />
                          </div>
                          <p className="text-2xl font-bold text-slate-900">{course.tickets}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Tickets</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-slate-900">{course.completionRate}%</p>
                          <p className="text-xs text-slate-500 mt-0.5">Avg. Completion</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-emerald-700">KES {(course.earnedToDate / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-slate-500 mt-0.5">Earned</p>
                        </div>
                      </div>
                    )}

                    {course.status === "Live" && (
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                            <span>Student completion rate</span>
                            <span className="font-bold text-slate-800">{course.completionRate}%</span>
                          </div>
                          <Progress value={course.completionRate} className="h-2" />
                        </div>
                        <div className="flex-shrink-0 text-xs font-semibold text-primary inline-flex items-center gap-1">
                          View details <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    )}

                    {course.status === "Draft" && (
                      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-500 flex items-center justify-between gap-3">
                        <span>This course is in draft. Add sprints and tickets, then submit for admin review to go live.</span>
                        <span className="flex items-center text-xs font-semibold text-primary">
                          Edit course <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      </div>
                    )}
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </InstructorLayout>
  );
}
