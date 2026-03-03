from sklearn.metrics import silhouette_score, calinski_harabasz_score
import numpy as np
import json
import sys
def evaluate_solution(data, labels):
    data_np = np.array(data)
    labels_np = np.array(labels)

    results = {}

    unique_labels = np.unique(labels_np)

    if len(unique_labels) > 1 and len(data_np) > len(unique_labels):
        results["SilhouetteScore"] = silhouette_score(data_np, labels_np)
        results["CalinskiHarabasz"] = calinski_harabasz_score(data_np, labels_np)
    else:
        results["SilhouetteScore"] = -1.0
        results["CalinskiHarabasz"] = 0.0

    return results


if __name__ == "__main__":
    try:
        input_file = sys.argv[1]

        with open(input_file, 'r') as f:
            input_data = json.load(f)

        data = input_data["Data"]
        labels = input_data["Labels"]

        evaluation = evaluate_solution(data, labels)

        print(json.dumps(evaluation))

    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)