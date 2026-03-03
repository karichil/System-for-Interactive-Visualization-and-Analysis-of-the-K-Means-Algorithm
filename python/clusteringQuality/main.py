from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, calinski_harabasz_score
import numpy as np
import json
import sys
import numpy as np

# def find_elbow(ks, inertias):
#     if not ks or len(ks) < 3:
#         return ks[0] if ks else 0
#
#     p1 = np.array([ks[0], inertias[0]])
#     p2 = np.array([ks[-1], inertias[-1]])
#
#     line_vec = p2 - p1
#     norm = np.linalg.norm(line_vec)
#     if norm == 0: return ks[0]
#
#     line_vec_norm = line_vec / norm
#
#     max_dist = -1.0
#     best_k = ks[0]
#
#     for i in range(len(ks)):
#         p = np.array([ks[i], inertias[i]])
#         vec_from_p1 = p - p1
#
#         proj_len = np.dot(vec_from_p1, line_vec_norm)
#         proj_point = p1 + proj_len * line_vec_norm
#
#         dist = np.linalg.norm(p - proj_point)
#
#         if dist > max_dist:
#             max_dist = dist
#             best_k = ks[i]
#
#     return int(best_k)


def find_elbow(ks, inertias):
    x1, y1 = ks[0], inertias[0]
    x2, y2 = ks[-1], inertias[-1]

    max_dist = 0
    best_k = ks[0]

    for i in range(len(ks)):
        x0 = ks[i]
        y0 = inertias[i]

        numerator = np.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)

        denominator = np.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)

        dist = numerator / denominator

        if dist > max_dist:
            max_dist = dist
            best_k = x0

    return int(best_k)
def evaluate_clusters(data, max_k=20):
    data_np = np.array(data)
    if data_np.size == 0:
        return {"Elbow": [], "Silhouette": [], "CalinskiHarabasz": []}

    n_unique_samples = len(np.unique(data_np, axis=0))

    safe_max_k = min(max_k, n_unique_samples - 1)

    results = {
        "Elbow": {"Points": [], "BestK": 0},
        "Silhouette": {"Points": [], "BestK": 0},
        "CalinskiHarabasz": {"Points": [], "BestK": 0}
    }

    if safe_max_k < 2:
        return results

    ks = []
    inertias = []
    sil_scores = []
    ch_scores = []

    for k in range(2, safe_max_k + 1):
        try:
            kmeans = KMeans(n_clusters=k, init='k-means++', random_state=42, n_init=5)
            labels = kmeans.fit_predict(data_np)

            inertia = kmeans.inertia_
            if 1 < len(np.unique(labels)) < len(data_np):
                sil = silhouette_score(data_np, labels)
                ch = calinski_harabasz_score(data_np, labels)
            else:
                sil = -1
                ch = 0

            ks.append(k)
            inertias.append(inertia)
            sil_scores.append(sil)
            ch_scores.append(ch)

            results["Elbow"]["Points"].append({"K": k, "Value": inertia})
            results["Silhouette"]["Points"].append({"K": k, "Value": sil})
            results["CalinskiHarabasz"]["Points"].append({"K": k, "Value": ch})

        except Exception as e:
            print(f"Warning: Skipping K={k} due to error: {e}")
            continue

    if ks:
        results["Elbow"]["BestK"] = find_elbow(ks, inertias)

        best_sil_idx = np.argmax(sil_scores)
        results["Silhouette"]["BestK"] = int(ks[best_sil_idx])

        best_ch_idx = np.argmax(ch_scores)
        results["CalinskiHarabasz"]["BestK"] = int(ks[best_ch_idx])

    return results

if __name__ == "__main__":
    try:
        data_file_path = sys.argv[1]
        with open(data_file_path, 'r') as f:
            data = json.load(f)

        final_results = evaluate_clusters(data, max_k=20)
        print(json.dumps(final_results))


    except Exception as e:
        print(json.dumps({"error": str(e)}))