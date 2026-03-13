import { useState } from "react";
import { motion } from "framer-motion";
import { User as UserIcon, Medal, Linkedin, CheckCircle2, Copy, ExternalLink, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { useUser } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Profile() {
  const { data: user, isLoading } = useUser();
  const { toast } = useToast();
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  if (isLoading || !user) {
    return (
      <MainLayout>
        <div className="p-8 max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  const openShareModal = (cert: any) => {
    setSelectedCert(cert);
    setShareModalOpen(true);
  };

  const getLinkedInTemplate = () => {
    if (!selectedCert) return "";
    return `Excited to share that I've completed the ${selectedCert.courseTitle} track on Fieldwork! 🚀\n\nOver ${selectedCert.sprintsCompleted} sprints, I tackled real-world work tickets simulating actual industry scenarios, moving past theory into practical execution.\n\n#ProofOfWork #Fieldwork #ContinuousLearning`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getLinkedInTemplate());
    toast({
      title: "Copied to clipboard",
      description: "You can now paste this into LinkedIn.",
    });
  };

  const handleOpenLinkedIn = () => {
    window.open("https://www.linkedin.com/feed/", "_blank", "noopener,noreferrer");
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="w-32 h-32 bg-slate-100 rounded-full border-4 border-white shadow-lg shrink-0 flex items-center justify-center text-slate-400 relative z-10">
            <UserIcon className="w-12 h-12" />
          </div>
          
          <div className="relative z-10 text-center md:text-left flex-1">
            <h1 className="text-3xl font-display font-bold text-slate-900">{user.name}</h1>
            <p className="text-lg text-slate-500 font-medium mt-1">{user.degree}</p>
            <p className="text-slate-400">{user.institution}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 px-3 py-1 text-sm font-bold">
                🔥 {user.currentStreak} Day Streak
              </Badge>
              <Badge variant="outline" className="text-slate-500 border-slate-200 px-3 py-1 text-sm font-medium">
                <CalendarDays className="w-4 h-4 mr-1.5" /> Joined {user.joinDate}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="border-0 shadow-sm hover-elevate">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900">{user.ticketsCompleted}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Tickets Completed</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover-elevate">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Medal className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900">{user.certificates.length}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Certificates Earned</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover-elevate">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900">1,450</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Total XP</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Certificates & Proof of Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Proof of Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.certificates.map(cert => (
              <Card key={cert.id} className="border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-all">
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                <CardHeader className="pb-2 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                      <Medal className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {format(parseISO(cert.dateEarned), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-tight">{cert.courseTitle}</CardTitle>
                  <p className="text-sm text-slate-500 mt-2 font-medium">{cert.sprintsCompleted} Sprints Completed</p>
                </CardHeader>
                <CardContent className="pt-4 pb-6 bg-slate-50 border-t border-slate-100 mt-4">
                  <Button 
                    onClick={() => openShareModal(cert)}
                    className="w-full bg-[#0077b5] hover:bg-[#006097] text-white shadow-md shadow-[#0077b5]/20"
                  >
                    <Linkedin className="w-4 h-4 mr-2" /> Share to LinkedIn
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* LinkedIn Share Modal */}
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl border-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-display">
                <Linkedin className="w-6 h-6 text-[#0077b5]" /> Share Achievement
              </DialogTitle>
              <DialogDescription className="text-[15px]">
                Copy this template and share your real-world progress with your network.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="relative">
                <Textarea 
                  readOnly 
                  value={getLinkedInTemplate()}
                  className="min-h-[160px] bg-slate-50 border-slate-200 text-sm leading-relaxed p-4 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" /> Copy Text
              </Button>
              <Button className="flex-1 bg-[#0077b5] hover:bg-[#006097]" onClick={handleOpenLinkedIn}>
                Open LinkedIn <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
}
