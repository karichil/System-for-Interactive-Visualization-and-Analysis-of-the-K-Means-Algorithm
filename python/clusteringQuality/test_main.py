import unittest
import numpy as np
from main import find_elbow, evaluate_clusters


class TestMainAnalysis(unittest.TestCase):

    def test_find_elbow_geometric(self):
        ks = [1, 2, 3, 4, 5]
        inertias = [1000, 500, 100, 90, 80]

        best_k = find_elbow(ks, inertias)
        self.assertEqual(best_k, 3)

    def test_evaluate_clusters_logic(self):
        blob1 = [[0 + np.random.rand(), 0 + np.random.rand()] for _ in range(10)]
        blob2 = [[10 + np.random.rand(), 10 + np.random.rand()] for _ in range(10)]
        blob3 = [[20 + np.random.rand(), 20 + np.random.rand()] for _ in range(10)]

        data = blob1 + blob2 + blob3
        results = evaluate_clusters(data, max_k=10)

        self.assertIn("Elbow", results)
        self.assertIn("Silhouette", results)
        self.assertIn("CalinskiHarabasz", results)
        self.assertIn("BestK", results["Elbow"])

        self.assertEqual(results["Silhouette"]["BestK"], 3)

        self.assertEqual(results["Elbow"]["BestK"], 3)

    def test_empty_data(self):
        results = evaluate_clusters([], max_k=5)
        self.assertEqual(results["Elbow"], [])

    def test_small_data(self):
        data = [[0, 0], [1, 1]]
        results = evaluate_clusters(data, max_k=20)

        self.assertEqual(results["Elbow"]["BestK"], 0)

if __name__ == '__main__':
    unittest.main()