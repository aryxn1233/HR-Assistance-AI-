import { auth } from "@clerk/nextjs/server";
import { RecruiterDashboardContent } from "@/components/dashboard/RecruiterDashboardContent";

async function getDashboardMetrics(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3003';
  try {
    const response = await fetch(`${API_URL}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 300 } // Cache results for 5 mins to match backend
    });

    if (!response.ok) {
      console.error("Dashboard fetch failed:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch dashboard metrics on server:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let metrics = null;
  if (token) {
    metrics = await getDashboardMetrics(token);
  }

  // Fallback metrics if fetch fails
  const fallbackMetrics = {
    totalCandidates: 0,
    activeJobs: 0,
    completedInterviews: 0,
    averageScore: 0,
    trends: {
      candidates: { value: 0, label: "from last month", positive: true },
      interviews: { value: 0, label: "from last month", positive: true },
      score: { value: 0, label: "improvement", positive: true },
      acceptance: { value: 0, label: "from last month", positive: false }
    }
  };

  return <RecruiterDashboardContent initialMetrics={metrics || fallbackMetrics} />;
}
