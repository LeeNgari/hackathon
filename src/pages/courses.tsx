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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-border pb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight underline decoration-primary decoration-4 underline-offset-8">Course Catalog</h1>
            <p className="text-muted-foreground mt-4 max-w-2xl text-lg font-medium">
              Learn by doing. Browse our collection of real-world ticket simulations designed by industry experts.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-background p-3 rounded-none border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
          <Tabs defaultValue="All" value={filter} onValueChange={setFilter} className="w-full sm:w-auto overflow-x-auto">
            <TabsList className="bg-transparent border-0 h-10 p-0 gap-2 w-max">
              {["All", "Tech", "Business", "Design", "Finance"].map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-transparent rounded-none px-4 text-sm font-bold transition-none border-2 border-border text-foreground hover:bg-secondary h-full"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-10 bg-background border-2 border-border text-foreground font-medium focus-visible:ring-0 focus-visible:border-primary rounded-none h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full rounded-none bg-secondary border-2 border-border" />)}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                className="h-full"
              >
                <Card className="h-full flex flex-col border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] transition-all overflow-hidden bg-background rounded-none">
                  <CardHeader className="p-6 pb-4 bg-secondary border-b-2 border-border">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary" className="bg-background text-foreground hover:bg-background border-2 border-border font-bold rounded-none px-3 py-1">
                        {course.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-bold border-2 border-border text-foreground bg-background rounded-none px-2 py-1">
                        {course.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-display font-bold leading-tight line-clamp-2 text-foreground">{course.title}</CardTitle>
                    <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-wide">by {course.instructor}</p>
                  </CardHeader>
                  
                  <CardContent className="p-6 pt-4 flex-1">
                    <div className="flex items-center gap-4 text-sm text-foreground font-bold">
                      <div className="flex items-center gap-2 bg-secondary px-3 py-2 border-2 border-border">
                        <Layers className="w-5 h-5 text-primary" />
                        <span>{course.totalSprints} Sprints</span>
                      </div>
                      <div className="flex items-center gap-2 bg-secondary px-3 py-2 border-2 border-border">
                        <Briefcase className="w-5 h-5 text-purple-400" />
                        <span>{course.totalTickets} Tickets</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto gap-4">
                    <div className="font-bold text-foreground text-xl">
                      KES {course.fee.toLocaleString()}
                    </div>
                    {course.isEnrolled ? (
                      <Button asChild size="default" variant="default" className="w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/90 border-b-4 border-primary/50 translate-y-[-2px] hover:translate-y-[0px] hover:border-b-0 transition-all rounded-none px-6">
                        <Link href={`/courses/${course.id}`}>Continue</Link>
                      </Button>
                    ) : (
                      <Button size="default" variant="outline" className="w-full sm:w-auto font-bold bg-secondary text-foreground hover:bg-background border-2 border-border rounded-none px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
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
          <div className="text-center py-20 bg-background rounded-none border-2 border-border border-dashed">
            <h3 className="text-2xl font-bold text-foreground mb-4 font-display">No courses found</h3>
            <p className="text-muted-foreground font-medium text-lg">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
