"use client";
import NextLink from "next/link";import {usePathname as useNextPathname} from "next/navigation";import type {ComponentProps} from "react";import {useLocale} from "./provider";
type LinkProps=Omit<ComponentProps<typeof NextLink>,"href">&{href:string};
export function Link({href,...props}:LinkProps){const locale=useLocale();const localized=href.startsWith(`/${locale}`)?href:`/${locale}${href==="/"?"":href.startsWith("/")?href:`/${href}`}`;return <NextLink href={localized} {...props}/>;}
export function usePathname(){const locale=useLocale(),pathname=useNextPathname();return pathname===`/${locale}`?"/":pathname.replace(`/${locale}`,"")||"/";}
