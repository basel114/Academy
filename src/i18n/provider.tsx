"use client";
import {createContext,useContext} from "react";
import en from "../../messages/en.json";import nl from "../../messages/nl.json";import ar from "../../messages/ar.json";
const dictionaries={en,nl,ar};type Locale=keyof typeof dictionaries;type Dictionary=typeof en;type Namespace=keyof Dictionary;
const LocaleContext=createContext<{locale:Locale;messages:Dictionary}>({locale:"en",messages:en});
export function I18nProvider({locale,children}:{locale:Locale;children:React.ReactNode}){return <LocaleContext.Provider value={{locale,messages:dictionaries[locale]}}>{children}</LocaleContext.Provider>;}
export function useLocale(){return useContext(LocaleContext).locale;}
export function useTranslations<N extends Namespace>(namespace:N){const {messages}=useContext(LocaleContext);return (key:keyof Dictionary[N])=>String(messages[namespace][key]??key);}
