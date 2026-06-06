export const typeChart = {

    fire: {
        grass: 2,
        water: 0.5,
        stone: 0.5,
        ice: 2
    },

    water: {
        fire: 2,
        stone: 2,
        grass: 0.5,
        electric: 0.5
    },

    grass: {
        water: 2,
        fire: 0.5,
        stone: 2,
        ice: 0.5
    },

    electric: {
        water: 2,
        stone: 0.5,
        grass: 0.5
    },

    stone: {
        fire: 2,
        electric: 2,
        water: 0.5,
        grass: 0.5
    },

    ice: {
        grass: 2,
        water: 0.5,
        fire: 0.5
    },

    dark: {
        grass: 1,
        fire: 1,
        water: 1
    },

    air: {
        grass: 2,
        stone: 0.5
    }
};
