import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Filter, Briefcase, Layers, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useCourses } from "@/hooks/use-app-data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Courses() {
  const { data: courses, isLoading } = useCourses();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredCourses = courses?.filter(c => {
    if (filter !== "All" && c.category !== filter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Course Catalog</h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Learn by doing. Browse our collection of real-world ticket simulations designed by industry experts.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Tabs defaultValue="All" value={filter} onValueChange={setFilter} className="w-full sm:w-auto overflow-x-auto">
            <TabsList className="bg-transparent border-0 h-10 p-0 gap-1 w-max">
              {["All", "Tech", "Business", "Design", "Finance"].map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl px-4 text-sm font-medium transition-all"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search courses..." 
              className="pl-9 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {filteredCourses?.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full flex flex-col hover-elevate border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white rounded-2xl">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {course.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-medium border-slate-200 text-slate-500">
                        {course.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl leading-tight line-clamp-2">{course.title}</CardTitle>
                    <p className="text-sm text-slate-500 mt-2">by {course.instructor}</p>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-0 flex-1">
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="font-medium">{course.totalSprints} Sprints</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
                        <Briefcase className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{course.totalTickets} Tickets</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
                    <div className="font-bold text-slate-900">
                      KES {course.fee.toLocaleString()}
                    </div>
                    {course.isEnrolled ? (
                      <Button asChild size="sm" variant="default" className="shadow-sm">
                        <Link href={`/courses/${course.id}`}>Continue</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="bg-white border-slate-200 hover:border-primary hover:text-primary">
                        Enroll Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {filteredCourses?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
            <h3 className="text-lg font-bold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
