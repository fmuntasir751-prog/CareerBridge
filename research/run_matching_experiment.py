import csv
import json
import sys

from pathlib import Path
from types import SimpleNamespace


RESEARCH_DIR = Path(__file__).resolve().parent
REPOSITORY_ROOT = RESEARCH_DIR.parent

sys.path.insert(
    0,
    str(REPOSITORY_ROOT),
)

from backend.jobs.matching import (
    calculate_job_match,
)


DATA_PATH = (
    RESEARCH_DIR
    / "matching_experiment_data.json"
)

RESULTS_PATH = (
    RESEARCH_DIR
    / "matching_experiment_results.csv"
)

SUMMARY_PATH = (
    RESEARCH_DIR
    / "matching_experiment_summary.json"
)

CHART_PATH = (
    RESEARCH_DIR
    / "matching_comparison.svg"
)


def skills_only_score(result):
    skills_score = (
        result["score_breakdown"]["skills"]
    )

    return round(
        skills_score / 40 * 100
    )


def mean_absolute_error(
    rows,
    score_key,
):
    total_error = sum(
        abs(
            row[score_key]
            - row["expected_fit"]
        )
        for row in rows
    )

    return round(
        total_error / len(rows),
        2,
    )


def ranking_accuracy(
    rows,
    score_key,
):
    comparable = 0
    correct = 0

    for left_index, left in enumerate(rows):
        remaining_rows = rows[
            left_index + 1:
        ]

        for right in remaining_rows:
            if (
                left["expected_fit"]
                == right["expected_fit"]
            ):
                continue

            comparable += 1

            expected_order = (
                left["expected_fit"]
                > right["expected_fit"]
            )

            predicted_order = (
                left[score_key]
                > right[score_key]
            )

            if (
                expected_order
                == predicted_order
            ):
                correct += 1

    if comparable == 0:
        return 0

    return round(
        correct / comparable * 100,
        2,
    )


def write_chart(rows):
    width = 920
    height = 430
    plot_left = 90
    plot_bottom = 350
    plot_height = 280
    group_width = 125

    svg = [
        (
            f'<svg '
            f'xmlns="http://www.w3.org/2000/svg" '
            f'width="{width}" '
            f'height="{height}" '
            f'viewBox="0 0 {width} {height}">'
        ),
        (
            '<rect '
            'width="100%" '
            'height="100%" '
            'fill="#ffffff"/>'
        ),
        (
            '<text '
            'x="460" '
            'y="28" '
            'text-anchor="middle" '
            'font-family="Arial" '
            'font-size="20" '
            'font-weight="700">'
            'Skills-only vs CareerBridge '
            'weighted matching'
            '</text>'
        ),
    ]

    for value in range(
        0,
        101,
        20,
    ):
        y = (
            plot_bottom
            - value / 100 * plot_height
        )

        svg.extend(
            [
                (
                    f'<line '
                    f'x1="{plot_left}" '
                    f'y1="{y}" '
                    f'x2="850" '
                    f'y2="{y}" '
                    f'stroke="#dbe4f0"/>'
                ),
                (
                    f'<text '
                    f'x="72" '
                    f'y="{y + 5}" '
                    f'text-anchor="end" '
                    f'font-family="Arial" '
                    f'font-size="12">'
                    f'{value}'
                    f'</text>'
                ),
            ]
        )

    for index, row in enumerate(rows):
        group_x = (
            plot_left
            + 35
            + index * group_width
        )

        bar_information = (
            (
                0,
                "skills_only",
                "#94a3b8",
            ),
            (
                34,
                "weighted_score",
                "#2563eb",
            ),
        )

        for (
            offset,
            key,
            color,
        ) in bar_information:
            value = row[key]

            bar_height = (
                value / 100 * plot_height
            )

            y = (
                plot_bottom
                - bar_height
            )

            svg.append(
                (
                    f'<rect '
                    f'x="{group_x + offset}" '
                    f'y="{y}" '
                    f'width="28" '
                    f'height="{bar_height}" '
                    f'rx="4" '
                    f'fill="{color}"/>'
                )
            )

            svg.append(
                (
                    f'<text '
                    f'x="{group_x + offset + 14}" '
                    f'y="{y - 6}" '
                    f'text-anchor="middle" '
                    f'font-family="Arial" '
                    f'font-size="11">'
                    f'{value}'
                    f'</text>'
                )
            )

        svg.append(
            (
                f'<text '
                f'x="{group_x + 31}" '
                f'y="375" '
                f'text-anchor="middle" '
                f'font-family="Arial" '
                f'font-size="13" '
                f'font-weight="700">'
                f'{row["case_id"]}'
                f'</text>'
            )
        )

    svg.extend(
        [
            (
                '<rect '
                'x="300" '
                'y="400" '
                'width="14" '
                'height="14" '
                'fill="#94a3b8"/>'
            ),
            (
                '<text '
                'x="320" '
                'y="412" '
                'font-family="Arial" '
                'font-size="12">'
                'Skills-only'
                '</text>'
            ),
            (
                '<rect '
                'x="430" '
                'y="400" '
                'width="14" '
                'height="14" '
                'fill="#2563eb"/>'
            ),
            (
                '<text '
                'x="450" '
                'y="412" '
                'font-family="Arial" '
                'font-size="12">'
                'Weighted'
                '</text>'
            ),
            "</svg>",
        ]
    )

    CHART_PATH.write_text(
        "\n".join(svg),
        encoding="utf-8",
    )


def main():
    dataset = json.loads(
        DATA_PATH.read_text(
            encoding="utf-8",
        )
    )

    profile = SimpleNamespace(
        **dataset["profile"],
    )

    rows = []

    for job_data in dataset["jobs"]:
        metadata = {
            key: job_data[key]
            for key in (
                "case_id",
                "label",
                "expected_fit",
            )
        }

        job = SimpleNamespace(
            **{
                key: value
                for key, value
                in job_data.items()
                if key not in metadata
            }
        )

        result = calculate_job_match(
            profile,
            job,
        )

        rows.append(
            {
                **metadata,
                "skills_only": (
                    skills_only_score(
                        result,
                    )
                ),
                "weighted_score": (
                    result["match_score"]
                ),
                "title_score": (
                    result[
                        "score_breakdown"
                    ]["job_title"]
                ),
                "location_score": (
                    result[
                        "score_breakdown"
                    ]["location"]
                ),
                "workplace_score": (
                    result[
                        "score_breakdown"
                    ]["workplace"]
                ),
                "japanese_score": (
                    result[
                        "score_breakdown"
                    ]["japanese_level"]
                ),
                "salary_score": (
                    result[
                        "score_breakdown"
                    ]["salary"]
                ),
            }
        )

    with RESULTS_PATH.open(
        "w",
        encoding="utf-8",
        newline="",
    ) as output:
        writer = csv.DictWriter(
            output,
            fieldnames=rows[0].keys(),
        )

        writer.writeheader()
        writer.writerows(rows)

    summary = {
        "dataset_type": (
            "controlled synthetic pilot data"
        ),
        "case_count": len(rows),
        "skills_only_mae": (
            mean_absolute_error(
                rows,
                "skills_only",
            )
        ),
        "weighted_mae": (
            mean_absolute_error(
                rows,
                "weighted_score",
            )
        ),
        (
            "skills_only_pairwise_"
            "ranking_accuracy"
        ): ranking_accuracy(
            rows,
            "skills_only",
        ),
        (
            "weighted_pairwise_"
            "ranking_accuracy"
        ): ranking_accuracy(
            rows,
            "weighted_score",
        ),
        "warning": (
            "These are controlled pilot "
            "results, not participant results. "
            "Replace or supplement them after "
            "the user evaluation."
        ),
    }

    SUMMARY_PATH.write_text(
        json.dumps(
            summary,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    write_chart(rows)

    print(
        json.dumps(
            summary,
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()