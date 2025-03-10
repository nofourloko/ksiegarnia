
class StaticData {
    static getDateSettings(){
        return {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        };
    }

    static getPurchaseStages(){
        return [
            { title: 'Koszyk' },
            { title: 'Dostawa i płatność' },
            { title: 'Finalizacja' }
        ];
    }

    static getProvinces(){
        return [
            { value: 'dolnoslaskie', name: 'Dolnośląskie' },
            { value: 'kujawsko-pomorskie', name: 'Kujawsko-Pomorskie' },
            { value: 'lubelskie', name: 'Lubelskie' },
            { value: 'lubuskie', name: 'Lubuskie' },
            { value: 'lodzkie', name: 'Łódzkie' },
            { value: 'malopolskie', name: 'Małopolskie' },
            { value: 'mazowieckie', name: 'Mazowieckie' },
            { value: 'opolskie', name: 'Opolskie' },
            { value: 'podkarpackie', name: 'Podkarpackie' },
            { value: 'podlaskie', name: 'Podlaskie' },
            { value: 'pomorskie', name: 'Pomorskie' },
            { value: 'slaskie', name: 'Śląskie' },
            { value: 'swietokrzyskie', name: 'Świętokrzyskie' },
            { value: 'warminsko-mazurskie', name: 'Warmińsko-Mazurskie' },
            { value: 'wielkopolskie', name: 'Wielkopolskie' },
            { value: 'zachodniopomorskie', name: 'Zachodniopomorskie' },
        ];
    }
}


module.exports = StaticData
