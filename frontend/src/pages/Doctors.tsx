import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Stethoscope,
  MapPin,
  Star,
  Clock,
  Phone,
  Calendar,
  Search,
  Heart,
  Brain,
  Eye,
  Bone,
  Users,
  Award,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const DOCTORS_CACHE_KEY = "sehatbeat_doctors_cache";

const labels = {
  en: {
    pageTitle: "Doctor Directory",
    pageSubtitle: "Find and book appointments with verified doctors near you",
    searchPlaceholder: "Search doctors or specializations...",
    all: "All",
    sortByRating: "Sort by Rating",
    sortByDistance: "Sort by Distance",
    sortByFee: "Sort by Fee",
    verified: "Verified",
    availableToday: "Available Today",
    nextWeek: "Next Week",
    consultation: "Consultation",
    call: "Call",
    book: "Book",
    yrsExp: "yrs exp",
    patients: "patients",
    away: "away",
    noDoctors: "No doctors found",
    tryCriteria: "Try adjusting your search criteria",
  },
  hi: {
    pageTitle: "डॉक्टर खोजें",
    pageSubtitle: "सत्यापित डॉक्टरों को खोजें और अपॉइंटमेंट बुक करें",
    searchPlaceholder: "डॉक्टर या विशेषज्ञता खोजें...",
    all: "सभी",
    sortByRating: "रेटिंग के अनुसार",
    sortByDistance: "दूरी के अनुसार",
    sortByFee: "फीस के अनुसार",
    verified: "सत्यापित",
    availableToday: "आज उपलब्ध",
    nextWeek: "अगले हफ्ते",
    consultation: "परामर्श",
    call: "कॉल करें",
    book: "बुक करें",
    yrsExp: "साल का अनुभव",
    patients: "मरीज",
    away: "दूर",
    noDoctors: "कोई डॉक्टर नहीं मिला",
    tryCriteria: "खोज मानदंड बदलकर देखें",
  },
};

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  rating: number;
  location: string;
  distance: string;
  availability: string;
  consultationFee: number;
  image?: string;
  languages: string[];
  verified: boolean;
}

type ApiDoctor = {
  id?: string;
  name?: string;
  specialization?: string;
  qualifications?: string;
  hospital?: string;
  city?: string;
  rating?: number;
  experience?: number;
  patients?: string;
  consultationFee?: number;
  available?: string;
  languages?: string[];
  distance?: number | string;
  verified?: boolean;
};

function mapApiDoctor(d: ApiDoctor, index: number): Doctor {
  const dist = d.distance != null ? (typeof d.distance === "number" ? `${d.distance}` : String(d.distance)) : "—";
  const loc = [d.hospital, d.city].filter(Boolean).join(", ") || "—";
  const avail = d.available === "today" ? "Available Today" : d.available === "next week" ? "Next Week" : (d.available || "—");
  return {
    id: d.id || `doc-${index}`,
    name: d.name || "Dr. Unknown",
    specialization: d.specialization || "General",
    qualification: d.qualifications || "MBBS",
    experience: typeof d.experience === "number" ? d.experience : 10,
    rating: typeof d.rating === "number" ? d.rating : 4.5,
    location: loc,
    distance: dist.includes("km") ? dist : `${dist} km`,
    availability: avail,
    consultationFee: typeof d.consultationFee === "number" ? d.consultationFee : 500,
    languages: Array.isArray(d.languages) ? d.languages : ["Hindi", "English"],
    verified: d.verified !== false,
  };
}

const getSpecializationIcon = (specialization: string) => {
  switch (specialization.toLowerCase()) {
    case "cardiologist":
      return Heart;
    case "neurologist":
      return Brain;
    case "ophthalmologist":
      return Eye;
    case "orthopedist":
      return Bone;
    default:
      return Stethoscope;
  }
};

const backendBase =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BACKEND_URL)
    ? String((import.meta as any).env.VITE_BACKEND_URL).replace(/\/+$/, "")
    : "http://localhost:3000";

const Doctors = () => {
  const { language } = useLanguage();
  const lang: "en" | "hi" = language === "hi" ? "hi" : "en";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "fee">("rating");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(DOCTORS_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ApiDoctor[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDoctors(parsed.map((d, i) => mapApiDoctor(d, i)));
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backendBase}/api/doctors`, { method: "GET" });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data.doctors) ? data.doctors : [];
        if (list.length > 0) {
          sessionStorage.setItem(DOCTORS_CACHE_KEY, JSON.stringify(list));
        }
        setDoctors(list.map((d: ApiDoctor, i: number) => mapApiDoctor(d, i)));
      } catch {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const specializations = ["All", ...Array.from(new Set(doctors.map((d) => d.specialization).filter(Boolean)))];
  const L = labels[lang];

  const filteredDoctors = doctors
    .filter((doctor) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        doctor.name.toLowerCase().includes(q) || doctor.specialization.toLowerCase().includes(q);
      const matchesSpec =
        selectedSpecialization === "All" || doctor.specialization === selectedSpecialization;
      return matchesSearch && matchesSpec;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "distance":
          return parseFloat(String(a.distance)) - parseFloat(String(b.distance));
        case "fee":
          return a.consultationFee - b.consultationFee;
        default:
          return 0;
      }
    });

  const availabilityText = (d: Doctor) => {
    if (d.availability.toLowerCase().includes("today")) return L.availableToday;
    if (d.availability.toLowerCase().includes("week")) return L.nextWeek;
    return d.availability;
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 lg:pb-6">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">{L.pageTitle}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{L.pageSubtitle}</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={L.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {specializations.map((spec) => (
              <Button
                key={spec}
                variant={selectedSpecialization === spec ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSpecialization(spec)}
                className={selectedSpecialization === spec ? "bg-primary text-primary-foreground" : ""}
              >
                {spec === "All" ? L.all : spec}
              </Button>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "distance" | "fee")}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="rating">{L.sortByRating}</option>
              <option value="distance">{L.sortByDistance}</option>
              <option value="fee">{L.sortByFee}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading doctors...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => {
                const IconComponent = getSpecializationIcon(doctor.specialization);
                return (
                  <Card key={doctor.id} className="hover:shadow-medium transition-shadow duration-200">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg leading-tight">{doctor.name}</CardTitle>
                              <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                              <p className="text-xs text-muted-foreground">{doctor.qualification}</p>
                            </div>
                            {doctor.verified && (
                              <Badge className="bg-primary text-primary-foreground">
                                <Award className="w-3 h-3 mr-1" />
                                {L.verified}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{doctor.rating}</span>
                            <span className="text-muted-foreground">
                              ({doctor.experience} {L.yrsExp})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{doctor.languages?.length ? "1000+ " : ""}{L.patients}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{doctor.location}</p>
                            <p className="text-xs">
                              {doctor.distance} {L.away}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {doctor.languages.map((language, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {language}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-primary font-medium">{availabilityText(doctor)}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">₹{doctor.consultationFee}</p>
                            <p className="text-xs text-muted-foreground">{L.consultation}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Phone className="w-4 h-4 mr-2" />
                            {L.call}
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-primary text-primary-foreground shadow-medium hover:shadow-strong"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            {L.book}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <Stethoscope className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">{L.noDoctors}</p>
                <p className="text-muted-foreground">{L.tryCriteria}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Doctors;
