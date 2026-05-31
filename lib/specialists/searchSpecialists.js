function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function searchSpecialists(specialists, filters = {}) {
    const city = normalize(filters.city || filters.citta);
    const province = normalize(filters.province || filters.provincia);
    const region = normalize(filters.region || filters.regione);
    const speciality = normalize(filters.speciality || filters.specialita);
    const clinicalArea = normalize(filters.clinicalArea || filters.areaClinica);
    const name = normalize(filters.name || filters.nome);
    const agendaOnly = filters.agendaOnly === true;

    return (specialists || []).filter((specialist) => {
        const fullName = normalize(`${specialist.titolo || ""} ${specialist.nome || ""} ${specialist.cognome || ""}`);
        if (name && !fullName.includes(name)) return false;
        if (city && !normalize(specialist.citta).includes(city)) return false;
        if (province && !normalize(specialist.provincia).includes(province)) return false;
        if (region && !normalize(specialist.regione).includes(region)) return false;
        if (speciality && !normalize(specialist.specialitaPrincipale).includes(speciality)) return false;
        if (clinicalArea && !normalize(`${specialist.areeCliniche || ""} ${specialist.patologieAssociate || ""}`).includes(clinicalArea)) return false;
        if (agendaOnly && specialist.agendaEnabled !== true) return false;
        return specialist.status !== "sospeso";
    });
}

module.exports = {
    searchSpecialists
};
