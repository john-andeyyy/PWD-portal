"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

import {
    ArrowLeft,
    Calendar,
    Cake,
    Phone,
    User,
    Home,
    MapPin,
    BadgeCheck,
    Accessibility,
    Mars,
    Venus,
    UserCircle2,
    Hash,
    Bed,
    Clock,
} from "lucide-react";

const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Member = {
    id: string;
    addedById: string;
    fname: string;
    lname: string;
    mname?: string | null;
    bday: string;
    disability: string;
    phoneNumber: string;
    address: string;
    barangay: string;
    isBedridden: boolean;
    pwdId: string;
    dateIssued?: string | null;
    gender: string;
    joinedAt: string;
};

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [member, setMember] = useState<Member | null>(null);

    useEffect(() => {
        const t = localStorage.getItem("auth_token");

        if (!t) {
            router.push("/");
            return;
        }

        setToken(t);
    }, [router]);

    useEffect(() => {
        if (!token) return;

        const id = params?.id;

        if (!id) return;

        fetch(`${apiBaseUrl}/members/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then(setMember)
            .catch(() => setMember(null));
    }, [token, params]);

    function computeAge(bday?: string) {
        if (!bday) return "-";

        const dob = new Date(bday);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();

        const m = today.getMonth() - dob.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age;
    }

    function formatDateDisplay(value?: string | null) {
        if (!value) return "-";

        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(parsedDate).replace(",", "");
    }

    const initials = useMemo(() => {
        if (!member) return "";

        return `${member.fname?.[0] ?? ""}${member.lname?.[0] ?? ""}`.toUpperCase();
    }, [member]);

    if (!token) return null;

    return (
        <main className="h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
            <div className="lg:flex h-full overflow-hidden">
                <Sidebar
                    onLogout={() => {
                        localStorage.removeItem("auth_token");
                        router.push("/");
                    }}
                />

                <section className="flex-1 overflow-y-auto lg:ml-80">
                    <div className="min-h-full p-6 lg:p-10">

                        {/* Back Button */}

                        <button
                            onClick={() => router.push("/members")}
                            className="mb-6 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft size={18} />
                            Back to Members
                        </button>

                        {/* Profile Header */}

                        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 shadow-2xl">

                            <div className="flex flex-col items-center gap-6 p-8 md:flex-row">

                                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white text-4xl font-bold text-indigo-600 shadow-lg">
                                    {initials}
                                </div>

                                <div className="flex-1 text-center md:text-left">

                                    <h1 className="text-4xl font-bold text-white">
                                        {[member?.fname, member?.mname, member?.lname]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </h1>

                                    <div className="mt-3 flex flex-wrap justify-center gap-3 md:justify-start">

                                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                                            <BadgeCheck className="mr-2 inline h-4 w-4" />
                                            PWD ID: {member?.pwdId}
                                        </span>

                                        <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
                                            {member?.disability}
                                        </span>

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information */}

                        {member ? (
                            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                                <InfoCard
                                    icon={<User size={22} />}
                                    title="First Name"
                                    value={member.fname || "-"}
                                />

                                <InfoCard
                                    icon={<User size={22} />}
                                    title="Middle Name"
                                    value={member.mname || "-"}
                                />

                                <InfoCard
                                    icon={<User size={22} />}
                                    title="Last Name"
                                    value={member.lname || "-"}
                                />
                                <InfoCard
                                    icon={<Cake size={22} />}
                                    title="Age"
                                    value={`${computeAge(member.bday)} years old`}
                                />

                                <InfoCard
                                    icon={<Calendar size={22} />}
                                    title="Birthday"
                                    value={
                                        member.bday
                                            ? formatDateDisplay(member.bday)
                                            : "-"
                                    }
                                />
                                <InfoCard
                                    icon={<BadgeCheck size={22} />}
                                    title="PWD ID"
                                    value={member.pwdId || "-"}
                                />

                                <InfoCard
                                    icon={<Calendar size={22} />}
                                    title="Date Issued"
                                    value={formatDateDisplay(member.dateIssued)}
                                />
                                <InfoCard
                                    icon={
                                        member.gender === "Female" ? (
                                            <Venus size={22} />
                                        ) : (
                                            <Mars size={22} />
                                        )
                                    }
                                    title="Gender"
                                    value={member.gender}
                                />
                                <InfoCard
                                    icon={<Accessibility size={22} />}
                                    title="Disability"
                                    value={member.disability}
                                />

                                <InfoCard
                                    icon={<Bed size={22} />}
                                    title="Bedridden"
                                    value={member.isBedridden ? "Yes" : "No"}
                                />

                                <InfoCard
                                    icon={<MapPin size={22} />}
                                    title="Barangay"
                                    value={member.barangay ?? "-"}
                                />
                                <InfoCard
                                    icon={<Phone size={22} />}
                                    title="Phone Number"
                                    value={member.phoneNumber || "-"}
                                />
                                <div className="lg:col-span-2">
                                    <InfoCard
                                        icon={<Home size={22} />}
                                        title="Complete Address"
                                        value={member.address || "-"}
                                    />
                                </div>

                                <InfoCard
                                    icon={<Clock size={22} />}
                                    title="Joined At"
                                    value={formatDateDisplay(member.joinedAt)}
                                />

                                <div className="lg:col-span-2">
                                    <InfoCard
                                        icon={<Hash size={22} />}
                                        title="Added By User ID"
                                        value={member.addedById || "-"}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-xl dark:bg-slate-900">
                                <UserCircle2
                                    className="mx-auto mb-4 animate-pulse text-slate-400"
                                    size={70}
                                />

                                <p className="text-lg font-medium text-slate-500">
                                    Loading member information...
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

type CardProps = {
    icon: React.ReactNode;
    title: string;
    value: string;
};

function InfoCard({ icon, title, value }: CardProps) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-start gap-4">

                <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {icon}
                </div>

                <div className="flex-1">

                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 break-words text-lg font-semibold text-slate-800 dark:text-white">
                        {value}
                    </p>

                </div>

            </div>
        </div>
    );
}
