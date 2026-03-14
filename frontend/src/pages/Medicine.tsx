import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Truck,
  Shield,
  Clock,
  Loader2,
  SlidersHorizontal,
  Mic,
  MicOff,
} from "lucide-react";
import { useMedicines, useCart } from "@/hooks/useConvex";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { useNetwork } from "@/hooks/useNetwork";
import { useLanguage } from "@/contexts/LanguageContext";

const categoryValues = ["All", "Pain Relief", "Vitamins", "Digestive Health", "Antibiotics", "Allergy"] as const;

type GeminiMedicine = {
  name: string;
  genericName?: string;
  category?: string;
  uses?: string[];
  dosage?: string;
  sideEffects?: string[];
  price?: number;
  requiresPrescription?: boolean;
  manufacturer?: string;
};

function mapGeminiToDisplay(m: GeminiMedicine, index: number): {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  dosage?: string;
  manufacturer?: string;
  inStock: boolean;
  prescriptionRequired: boolean;
  genericName?: string;
  imageUrl?: string;
} {
  const uses = Array.isArray(m.uses) ? m.uses : [];
  return {
    _id: `gemini-${index}-${(m.name || "").replace(/\s/g, "-")}`,
    name: m.name || "Medicine",
    description: uses.length ? uses[0] : (m.category || "General use"),
    price: typeof m.price === "number" ? m.price : 99,
    category: m.category || "General",
    dosage: m.dosage,
    manufacturer: m.manufacturer,
    inStock: true,
    prescriptionRequired: !!m.requiresPrescription,
    genericName: m.genericName,
    imageUrl: undefined,
  };
}

const backendBase = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BACKEND_URL)
  ? String((import.meta as any).env.VITE_BACKEND_URL).replace(/\/+$/, "")
  : "http://localhost:3000";

const Medicine = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"relevance" | "priceLowHigh" | "priceHighLow">("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [prescriptionOnly, setPrescriptionOnly] = useState(false);
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useNetwork();
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const searchRecognitionRef = useRef<SpeechRecognition | null>(null);

  const [geminiMedicines, setGeminiMedicines] = useState<ReturnType<typeof mapGeminiToDisplay>[] | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const categoryLabelByValue: Record<string, string> = {
    All: t("medicine.categoryAll"),
    "Pain Relief": t("medicine.categoryPainRelief"),
    Vitamins: t("medicine.categoryVitamins"),
    "Digestive Health": t("medicine.categoryDigestiveHealth"),
    Antibiotics: t("medicine.categoryAntibiotics"),
    Allergy: t("medicine.categoryAllergy"),
  };

  const convexMedicines = useMedicines(
    selectedCategory === "All" ? undefined : selectedCategory,
    searchTerm || undefined
  );

  const { cartItems, addItemToCart, updateItemQuantity, removeItemFromCart } = useCart();

  useEffect(() => {
    if (convexMedicines !== undefined && Array.isArray(convexMedicines) && convexMedicines.length > 0) {
      return;
    }
    const timer = setTimeout(async () => {
      if (convexMedicines === undefined || (Array.isArray(convexMedicines) && convexMedicines.length === 0)) {
        setGeminiLoading(true);
        try {
          const res = await fetch(`${backendBase}/api/medicines`, { method: "GET" });
          const data = await res.json().catch(() => ({}));
          const list = Array.isArray(data.medicines) ? data.medicines : [];
          setGeminiMedicines(list.map((m: GeminiMedicine, i: number) => mapGeminiToDisplay(m, i)));
        } catch {
          setGeminiMedicines([]);
        } finally {
          setGeminiLoading(false);
        }
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [convexMedicines]);

  // Voice search (speech-to-text) for medicine search bar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const AnyWindow = window as any;
    const SR =
      AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition;
    if (!SR) {
      searchRecognitionRef.current = null;
      return;
    }

    const r = new SR();
    r.continuous = false;
    r.interimResults = false;

    let lang: "en-IN" | "hi-IN" = "en-IN";
    try {
      const stored = window.localStorage?.getItem("sehatbeat_language");
      if (stored === "hi") lang = "hi-IN";
    } catch {
      // ignore storage errors
    }
    r.lang = lang;

    r.onresult = (event: any) => {
      const results = Array.from(event.results || []);
      const transcript = results
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setSearchTerm(transcript);
      }
    };
    r.onend = () => {
      setIsVoiceSearching(false);
    };
    r.onerror = () => {
      setIsVoiceSearching(false);
    };

    searchRecognitionRef.current = r;

    return () => {
      try {
        r.onresult = null as any;
        r.onend = null as any;
        r.onerror = null as any;
        r.stop();
      } catch {
        // ignore
      }
    };
  }, []);
  const hasConvex = Array.isArray(convexMedicines) && convexMedicines.length > 0;
  const baseMedicines = hasConvex
    ? convexMedicines
    : (geminiMedicines ?? []);

  let filteredMedicines = baseMedicines;

  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    filteredMedicines = filteredMedicines.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        (m.category?.toLowerCase().includes(q)) ||
        m.description?.toLowerCase().includes(q)
    );
  }
  if (selectedCategory !== "All") {
    filteredMedicines = filteredMedicines.filter((m) => m.category === selectedCategory);
  }
  if (inStockOnly) {
    filteredMedicines = filteredMedicines.filter((medicine) => medicine.inStock);
  }

  if (prescriptionOnly) {
    filteredMedicines = filteredMedicines.filter((medicine) => medicine.prescriptionRequired);
  }

  if (sortBy === "priceLowHigh") {
    filteredMedicines = [...filteredMedicines].sort(
      (a, b) => (a.price || 0) - (b.price || 0)
    );
  } else if (sortBy === "priceHighLow") {
    filteredMedicines = [...filteredMedicines].sort(
      (a, b) => (b.price || 0) - (a.price || 0)
    );
  }

  const addToCart = async (medicineId: string) => {
    if (!isSignedIn) {
      // Handle authentication requirement
      return;
    }
    
    try {
      await addItemToCart(medicineId, 1);
      
      // Find the medicine name for the toast
      const medicine = baseMedicines.find(m => m._id === medicineId);
      
      toast({
        title: t('medicine.addedToCart'),
        description: `${medicine?.name || t('medicine.title')} ${t('medicine.addedToCartDesc')}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('medicine.failedAdd'),
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await removeItemFromCart(cartItemId);
      
      toast({
        title: t('medicine.removedFromCart'),
        description: t('medicine.itemRemoved'),
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('medicine.failedRemove'),
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await updateItemQuantity(cartItemId, quantity);
      
      if (quantity === 0) {
        toast({
          title: t('medicine.removedFromCart'),
          description: t('medicine.itemRemoved'),
          duration: 3000,
        });
      } else {
        toast({
          title: t('medicine.cartUpdated'),
          description: `${t('medicine.quantityUpdated')} ${quantity}.`,
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('medicine.failedUpdate'),
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getTotalItems = () => {
    return cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getTotalPrice = () => {
    return cartItems?.reduce((total, item) => {
      return total + (item.medicine?.price || 0) * item.quantity;
    }, 0) || 0;
  };

  const getCartItemQuantity = (medicineId: string) => {
    const cartItem = cartItems?.find(item => item.medicineId === medicineId);
    return cartItem?.quantity || 0;
  };

  const getCartItemId = (medicineId: string) => {
    const cartItem = cartItems?.find(item => item.medicineId === medicineId);
    return cartItem?._id;
  };

  const showLoading = convexMedicines === undefined && geminiMedicines === null;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-20 lg:pb-6">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
                <ShoppingCart className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t("medicine.title")}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("medicine.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">{t('medicine.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 lg:pb-6">
      <div className="container mx-auto px-4 py-8">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Debug Info</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Medicines Status: {showLoading ? 'Loading...' : `Loaded (${baseMedicines.length})`}</p>
              <p>Search Term: {searchTerm || 'None'}</p>
              <p>Selected Category: {selectedCategory}</p>
              <p>Cart Items: {cartItems?.length || 0}</p>
            </div>
          </div>
        )}

        {/* Offline indicator */}
        {!isOnline && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
            {t('medicine.offline')}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
              <ShoppingCart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">{t("medicine.title")}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("medicine.subtitle")}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('medicine.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              aria-label={isVoiceSearching ? t("medicine.stopVoiceSearch") : t("medicine.startVoiceSearch")}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 border text-muted-foreground bg-background hover:bg-muted transition-colors ${
                isVoiceSearching ? "bg-red-500 text-white border-red-500 hover:bg-red-600" : ""
              }`}
              onClick={() => {
                const rec = searchRecognitionRef.current;
                if (!rec) {
                  toast({
                    title: t("medicine.voiceSearchNotSupported"),
                    description: t("medicine.voiceSearchNotSupportedDesc"),
                  });
                  return;
                }
                try {
                  if (isVoiceSearching) {
                    rec.stop();
                    setIsVoiceSearching(false);
                  } else {
                    rec.start();
                    setIsVoiceSearching(true);
                  }
                } catch {
                  setIsVoiceSearching(false);
                }
              }}
            >
              {isVoiceSearching ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categoryValues.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-primary text-primary-foreground" : ""}
              >
                {categoryLabelByValue[category] || category}
              </Button>
            ))}
          </div>

          {/* Advanced filters & sorting */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('medicine.filters')}</span>
              </div>
              <Button
                type="button"
                variant={inStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setInStockOnly((prev) => !prev)}
              >
                {t('medicine.inStockOnly')}
              </Button>
              <Button
                type="button"
                variant={prescriptionOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setPrescriptionOnly((prev) => !prev)}
              >
                {t('medicine.prescriptionOnly')}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('medicine.sortBy')}</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "relevance" | "priceLowHigh" | "priceHighLow")
                }
                className="border border-input bg-background rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="relevance">{t('medicine.relevance')}</option>
                <option value="priceLowHigh">{t('medicine.priceLowHigh')}</option>
                <option value="priceHighLow">{t('medicine.priceHighLow')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {getTotalItems() > 0 && (
          <Card className="mb-8 border-primary/20 bg-primary-soft/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">
                    {getTotalItems()} {t('medicine.itemsInCart')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-primary">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                  <Button className="bg-gradient-primary text-primary-foreground shadow-medium hover:shadow-strong">
                    {t('medicine.checkout')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results summary */}
        {filteredMedicines.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            {t("medicine.showing")}{" "}
            <span className="font-semibold text-foreground">
              {filteredMedicines.length}
            </span>{" "}
            {t("medicine.medicines")}
            {inStockOnly && ` • ${t("medicine.inStockOnly")}`}
            {prescriptionOnly && ` • ${t("medicine.prescriptionOnly")}`}
          </div>
        )}

        {/* No Medicines Message */}
        {filteredMedicines.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="p-6 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('medicine.noMedicinesFound')}</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== "All"
                    ? `${t('medicine.noMedicinesMatch')} "${searchTerm}" ${t('medicine.inCategory')} "${categoryLabelByValue[selectedCategory] || selectedCategory}"`
                    : t('medicine.catalogEmpty')
                  }
                </p>
                <div className="space-y-3">
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• {t('medicine.tryDifferentSearch')}</li>
                    <li>• {t('medicine.selectDifferentCategory')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medicine Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine) => {
            const cartQuantity = getCartItemQuantity(medicine._id);
            const cartItemId = getCartItemId(medicine._id);
            
            return (
              <Card key={medicine._id} className="hover:shadow-medium transition-shadow duration-200">
                <CardHeader className="p-4 pb-2">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {medicine.imageUrl ? (
                      <img 
                        src={medicine.imageUrl} 
                        alt={medicine.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">{t("medicine.noImage")}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-tight">{medicine.name}</CardTitle>
                      {medicine.prescriptionRequired && (
                        <Badge variant="secondary" className="text-xs">Rx</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{medicine.description}</p>
                    {medicine.genericName && (
                      <p className="text-xs text-muted-foreground">
                        {t("medicine.generic")}: {medicine.genericName}
                      </p>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">4.5</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-foreground">${medicine.price}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="w-3 h-3" />
                      <span>{t('medicine.freeDelivery')}</span>
                      <Shield className="w-3 h-3 ml-2" />
                      <span>{t('medicine.verified')}</span>
                    </div>

                    {medicine.inStock ? (
                      <div className="flex items-center justify-between">
                        {cartQuantity > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cartItemId && updateQuantity(cartItemId, cartQuantity - 1)}
                              className="w-8 h-8 p-0"
                              disabled={!isSignedIn}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{cartQuantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cartItemId && updateQuantity(cartItemId, cartQuantity + 1)}
                              className="w-8 h-8 p-0"
                              disabled={!isSignedIn}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(medicine._id)}
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            size="sm"
                            disabled={!isSignedIn}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('medicine.addToCart')}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-destructive">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{t('medicine.outOfStock')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
            {t('medicine.noResults')}
          </p>
          </div>
        )}

        {!isSignedIn && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
            {t('medicine.signInToAdd')}
          </p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {isSignedIn && getTotalItems() > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40"
        >
          <Button
            size="lg"
            className="bg-gradient-primary text-primary-foreground shadow-strong hover:shadow-stronger rounded-full w-14 h-14 p-0 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {getTotalItems() > 99 ? '99+' : getTotalItems()}
            </span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default Medicine;