import AuthPage, { type AuthParams } from "@/components/AuthPage";
export default function Page({ searchParams }: { searchParams: AuthParams }) {
  return <AuthPage kind="login" searchParams={searchParams}/>;
}