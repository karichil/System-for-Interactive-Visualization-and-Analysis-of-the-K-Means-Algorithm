import unittest
from eval_final import evaluate_solution

class TestEvalFinal(unittest.TestCase):

    def test_perfect_separation(self):
        data = [[0, 0], [0, 1], [10, 10], [10, 11]]
        labels = [0, 0, 1, 1]

        result = evaluate_solution(data, labels)

        self.assertGreater(result['SilhouetteScore'], 0.8)
        self.assertGreater(result['CalinskiHarabasz'], 10.0)

    def test_bad_separation(self):
        """Testuje sytuację, gdzie etykiety są przydzielone losowo/źle."""
        data = [[0, 0], [0, 1], [10, 10], [10, 11]]
        labels = [0, 1, 0, 1]

        result = evaluate_solution(data, labels)

        self.assertLess(result['SilhouetteScore'], 0.5)

    def test_single_cluster_edge_case(self):
        data = [[0, 0], [1, 1], [2, 2]]
        labels = [0, 0, 0]

        result = evaluate_solution(data, labels)

        self.assertEqual(result['SilhouetteScore'], -1.0)
        self.assertEqual(result['CalinskiHarabasz'], 0.0)

if __name__ == '__main__':
    unittest.main()