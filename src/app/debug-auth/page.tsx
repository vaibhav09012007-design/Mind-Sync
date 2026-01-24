import { auth } from "@clerk/nextjs/server";

export default async function DebugAuthPage() {
  const { userId, sessionId, getToken } = await auth();
  const token = await getToken();
  
  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Auth Debugger</h1>
      <div className="space-y-2 bg-slate-100 dark:bg-slate-900 p-4 rounded border">
        <div>
          <span className="font-bold">User ID:</span> {userId || "null (Not Authenticated)"}
        </div>
        <div>
          <span className="font-bold">Session ID:</span> {sessionId || "null"}
        </div>
        <div>
          <span className="font-bold">Token Present:</span> {token ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-bold">Environment:</span>
          <ul className="ml-4 list-disc mt-1">
            <li>CLERK_SECRET_KEY: {process.env.CLERK_SECRET_KEY ? "Set (Hidden)" : "MISSING"}</li>
            <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "MISSING"}</li>
          </ul>
        </div>
      </div>
      <p className="mt-4 text-gray-500">
        If User ID is "null" but you are logged in on the Client, your Secret Key is likely invalid or mismatched.
      </p>
    </div>
  );
}
