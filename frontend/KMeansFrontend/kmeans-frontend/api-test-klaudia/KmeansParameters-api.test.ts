import axios from 'axios';

describe('KMeans API Integration Tests', () => {
    const API_ALGORITHM_URL = 'http://localhost:5075/api/KMeansAlgoritm';

    const testDataset = {
        points: [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 8, y: 8 }
        ]
    };

    const testCentroids = {
        centroids: [
            { x: 1, y: 2 },
            { x: 8, y: 8 }
        ]
    };

    const testMetric = 'Euclidean';
    const testMaxIterations = 10;

    const createInitRequest = () => ({
        DataSet: testDataset,
        CentroidManager: testCentroids,
        MaxIterations: testMaxIterations,
        MetricName: testMetric
    });

    // ----------------------------
    // INITIALIZE TEST
    // ----------------------------
    it('should initialize and return centroids (valid DTO)', async () => {
        const response = await axios.post(
            `${API_ALGORITHM_URL}/initialize`,
            createInitRequest()
        );

        expect(response.status).toBe(200);

        // stronger checks
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);

        response.data.forEach((c: any) => {
            expect(c).toHaveProperty('x');
            expect(c).toHaveProperty('y');
        });
    });

    // ----------------------------
    // STEP FORWARD TEST
    // ----------------------------
    it('should perform step-forward and update points with clusterId', async () => {
        // 1. Initialize
        await axios.post(
            `${API_ALGORITHM_URL}/initialize`,
            createInitRequest()
        );

        // 2. Step forward
        const response = await axios.post(
            `${API_ALGORITHM_URL}/step-forward`
        );

        expect(response.status).toBe(200);

        // matches C# expectation (DataSetDto)
        expect(response.data).toHaveProperty('points');

        response.data.points.forEach((p: any) => {
            expect(p).toHaveProperty('clusterId');
        });
    });

    // ----------------------------
    // FINISH RESULT TEST
    // ----------------------------
    it('should return final result with isFinished=true', async () => {
        // 1. Initialize
        await axios.post(
            `${API_ALGORITHM_URL}/initialize`,
            createInitRequest()
        );

        // 2. Finish algorithm
        const response = await axios.post(
            `${API_ALGORITHM_URL}/finish-result`
        );

        expect(response.status).toBe(200);

        expect(response.data).toHaveProperty('isFinished');
        expect(response.data.isFinished).toBe(true);
    });

    // ----------------------------
    // NEGATIVE TEST (extra improvement)
    // ----------------------------
    it('should return error when initializing with invalid data', async () => {
        try {
            await axios.post(`${API_ALGORITHM_URL}/initialize`, {});
        } catch (error: any) {
            expect(error.response.status).toBe(400);
        }
    });
});