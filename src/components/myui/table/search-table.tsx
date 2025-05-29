import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const SearchTable = ({ page, debouncedSearchQuery, setDebouncedSearchQuery }: any) => {
    const router = useRouter();
    const pathname = usePathname(); // Utilisation de usePathname pour obtenir le chemin actuel
    const searchParams = useSearchParams(); // Utilisation de useSearchParams pour accéder aux paramètres de recherche
    const s = useTranslations("System");
    const [searchQuery, setSearchQuery] = useState(debouncedSearchQuery ?? "");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);

            // Manipulation des paramètres de recherche pour la pagination et la recherche
            const params = new URLSearchParams(searchParams.toString()); // Convertir les searchParams en URLSearchParams
            params.set("page", page.toString()); // Assurez-vous d'inclure le paramètre "page"
            if (searchQuery && searchQuery !== "") {
                params.set("search", searchQuery); // Ajoutez le paramètre "search" si nécessaire
            }else {
                params.delete("search"); // Supprimez le paramètre "search" si la recherche est vide
            }

            // Redirection avec la nouvelle URL
            router.push(`${pathname}?${params.toString()}`);
        }, 500); // Délai de 500 ms pour le debounce

        return () => {
            clearTimeout(handler); // Nettoyage du timeout pour éviter les appels multiples
        };
    }, [searchQuery, page, searchParams, setDebouncedSearchQuery, router, pathname]);

    return (
        <Input
            placeholder={s("search")}
            value={searchQuery} // Utiliser searchQuery au lieu de globalFilter
            onChange={(event) => {
                setSearchQuery(event.target.value); // Mettre à jour searchQuery
            }}
            className="max-w-sm mb-4"
        />
    );
};

export default SearchTable;
