// lib/icon-map.ts
import {
    Bed,
    BookUser,
    Cake,
    Car,
    CreditCard,
    Dumbbell,
    Gamepad2,
    GraduationCap,
    Heart,
    HeartHandshake,
    HelpCircle,
    Home,
    Plug,
    ShieldCheck,
    Shirt,
    ShoppingCart,
    Smartphone,
    Stethoscope,
    Sun,
    Utensils,
    Tv,
    Users,
    Wallet,
    Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Wichtig:
 * Keys müssen mit `availableIcons.name` übereinstimmen,
 * weil du beim Speichern `category = selectedIconEntry.name` setzt.
 * (z. B. "Möbiliar", nicht mehr "Kinderzimmer")
 */
export const iconMap: Record<string, LucideIcon> = {
    Miete: Home,
    Urlaub: Sun,
    Strom: Plug,
    Internet: Wifi,
    Streaming: Tv, // name: 'Streaming' (defaultLabel kann 'Streamingdienste' sein)
    Versicherungen: ShieldCheck,
    Sport: Dumbbell, // name: 'Sport' (statt 'Fitnessstudio')
    Abos: BookUser, // name: 'Abos' (defaultLabel: 'Abonnements')
    Ratenzahlung: CreditCard,
    Mitgliedschaften: HeartHandshake,
    Essengehen: Utensils,
    Mobilfunk: Smartphone, // name: 'Mobilfunk' (defaultLabel: 'Mobilfunkvertrag')
    Kleidung: Shirt,
    Schule: GraduationCap,
    Lebensmittel: ShoppingCart,
    Hobbys: Heart,
    Spielzeug: Gamepad2,
    Gesundheit: Stethoscope,
    Möbiliar: Bed, // ✅ vorher "Kinderzimmer"
    Transport: Car,
    Geburtstage: Cake,
    Betreuung: Users,
    Finanzen: Wallet,
    Sonstiges: HelpCircle,
}
