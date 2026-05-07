import { test, expect } from '@playwright/test';

/*Autorem wszytskich testów z pliku jest Karina Chilkiewicz*/

const BASE_URL = 'http://localhost:5075/api/KMeansAlgoritm';

const mockInitRequest = {
    DataSet: {
        Points: [
            { X: 1.0, Y: 1.0, ClusterId: -1 },
            { X: 1.5, Y: 2.0, ClusterId: -1 },
            { X: 8.0, Y: 8.0, ClusterId: -1 },
            { X: 9.0, Y: 8.5, ClusterId: -1 }
        ]
    },
    CentroidManager: {
        Centroids: [
            { X: 1.0, Y: 1.0, ClusterId: 0 },
            { X: 9.0, Y: 8.5, ClusterId: 1 }
        ]
    },
    MetricName: "Euclidean",
    MaxIterations: 30
};

test.describe('Testy API - Algorytm K-Means', () => {

    /*Weryfikacja endpointu /initialize. Test wysyła poprawne dane DTO (punkty, centroidy, metrykę)
     i sprawdza, czy API zwraca status 200 OK oraz listę początkowych centroidów.*/
    test('POST /initialize - poprawna inicjalizacja algorytmu', async ({ request }) => {
        const response = await request.post(`${BASE_URL}/initialize`, {
            data: mockInitRequest
        });
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBeTruthy();
        expect(responseBody.length).toBeGreaterThan(0);

        expect(responseBody[0]).toHaveProperty('x');
        expect(responseBody[0]).toHaveProperty('clusterId');
    });

    /*Weryfikacja endpointu /finish-result. Test najpierw inicjalizuje algorytm (stan początkowy),
     a następnie wywołuje finish-result, oczekując obiektu AlgorithmResultDto z właściwością IsFinished = true.*/
    test('POST /finish-result - poprawne zakończenie algorytmu', async ({ request }) => {
        await request.post(`${BASE_URL}/initialize`, { data: mockInitRequest });

        const response = await request.post(`${BASE_URL}/finish-result`, {
            data: mockInitRequest
        });

        expect(response.status()).toBe(200);

        const resultDto = await response.json();

        expect(resultDto).toHaveProperty('centroids');
        expect(resultDto).toHaveProperty('points');
        expect(resultDto).toHaveProperty('iteration');
        expect(resultDto).toHaveProperty('isFinished');

        expect(resultDto.isFinished).toBe(true);
    });

    /*Weryfikacja endpointu /step-forward. Po zainicjalizowaniu danych test wywołuje jeden krok algorytmu i sprawdza,
    czy zwracany jest poprawny DTO ze zaktualizowanymi centroidami i punktami.*/
    test('POST /step-forward - wykonanie pojedynczego kroku', async ({ request }) => {
        await request.post(`${BASE_URL}/initialize`, { data: mockInitRequest });

        const response = await request.post(`${BASE_URL}/step-forward`);

        expect(response.status()).toBe(200);

        const resultDto = await response.json();

        expect(resultDto.centroids.length).toBeGreaterThan(0);
        expect(resultDto.points.length).toBeGreaterThan(0);

        expect(typeof resultDto.iteration).toBe('number');
    });

});