import asyncio
from typing import Any, NamedTuple, Optional

from app.ai.query_parser import SearchIntent, parse_query
from app.db.models import EmploymentType, ExperienceLevel, RemoteType


class TestCase(NamedTuple):
    query: str
    expected_emp_type: Optional[EmploymentType]
    expected_duration: Optional[int]
    expected_exp_level: Optional[ExperienceLevel]
    expected_location: Optional[str]
    expected_remote: Optional[RemoteType]
    keyword_substr: Optional[str]


BENCHMARK_CASES: list[TestCase] = [
    TestCase(
        query="6 month embedded software internship in Bangalore, fresher",
        expected_emp_type=EmploymentType.INTERNSHIP,
        expected_duration=6,
        expected_exp_level=ExperienceLevel.ENTRY,
        expected_location="Bangalore",
        expected_remote=None,
        keyword_substr="embedded software",
    ),
    TestCase(
        query="Senior React frontend engineer in London, remote",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.SENIOR,
        expected_location="London",
        expected_remote=RemoteType.REMOTE,
        keyword_substr="frontend",
    ),
    TestCase(
        query="Full time machine learning engineer in San Francisco",
        expected_emp_type=EmploymentType.FULL_TIME,
        expected_duration=None,
        expected_exp_level=None,
        expected_location="San Francisco",
        expected_remote=None,
        keyword_substr="machine learning",
    ),
    TestCase(
        query="Summer backend intern in New York",
        expected_emp_type=EmploymentType.INTERNSHIP,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.INTERN,
        expected_location="New York",
        expected_remote=None,
        keyword_substr="backend",
    ),
    TestCase(
        query="Staff DevOps engineer remote USA",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.SENIOR,
        expected_location="USA",
        expected_remote=RemoteType.REMOTE,
        keyword_substr="devops",
    ),
    TestCase(
        query="3 month data engineering internship in Berlin",
        expected_emp_type=EmploymentType.INTERNSHIP,
        expected_duration=3,
        expected_exp_level=ExperienceLevel.INTERN,
        expected_location="Berlin",
        expected_remote=None,
        keyword_substr="data engineering",
    ),
    TestCase(
        query="Junior product designer in Toronto, hybrid",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.ENTRY,
        expected_location="Toronto",
        expected_remote=RemoteType.HYBRID,
        keyword_substr="product designer",
    ),
    TestCase(
        query="Entry level iOS mobile developer in Tokyo",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.ENTRY,
        expected_location="Tokyo",
        expected_remote=None,
        keyword_substr="mobile",
    ),
    TestCase(
        query="Full stack Python developer contract 12 months",
        expected_emp_type=EmploymentType.CONTRACT,
        expected_duration=12,
        expected_exp_level=None,
        expected_location=None,
        expected_remote=None,
        keyword_substr="python",
    ),
    TestCase(
        query="Senior security engineer in Singapore",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.SENIOR,
        expected_location="Singapore",
        expected_remote=None,
        keyword_substr="security",
    ),
    TestCase(
        query="Part time QA automation tester remote",
        expected_emp_type=EmploymentType.PART_TIME,
        expected_duration=None,
        expected_exp_level=None,
        expected_location=None,
        expected_remote=RemoteType.REMOTE,
        keyword_substr="qa",
    ),
    TestCase(
        query="Fresher software engineer in Hyderabad",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.ENTRY,
        expected_location="Hyderabad",
        expected_remote=None,
        keyword_substr="software engineer",
    ),
    TestCase(
        query="Lead cloud architect in Zurich onsite",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.SENIOR,
        expected_location="Zurich",
        expected_remote=RemoteType.ONSITE,
        keyword_substr="cloud architect",
    ),
    TestCase(
        query="Machine learning research intern remote 6 months",
        expected_emp_type=EmploymentType.INTERNSHIP,
        expected_duration=6,
        expected_exp_level=ExperienceLevel.INTERN,
        expected_location=None,
        expected_remote=RemoteType.REMOTE,
        keyword_substr="machine learning",
    ),
    TestCase(
        query="Mid level hardware verification engineer in Austin",
        expected_emp_type=None,
        expected_duration=None,
        expected_exp_level=ExperienceLevel.MID,
        expected_location="Austin",
        expected_remote=None,
        keyword_substr="hardware",
    ),
]


async def evaluate_all() -> dict[str, Any]:
    """Runs all 15 benchmark test cases and computes field accuracy metrics."""
    field_counts = {
        "emp_type": 0,
        "duration": 0,
        "exp_level": 0,
        "location": 0,
        "remote": 0,
        "keywords": 0,
    }
    field_correct = {
        "emp_type": 0,
        "duration": 0,
        "exp_level": 0,
        "location": 0,
        "remote": 0,
        "keywords": 0,
    }
    exact_matches = 0

    print("=" * 80)
    print("Sift Query Parser Evaluation Benchmark (15 Queries)")
    print("=" * 80)

    for i, tc in enumerate(BENCHMARK_CASES, start=1):
        parsed: SearchIntent = await parse_query(tc.query)
        case_perfect = True

        # Check emp_type
        field_counts["emp_type"] += 1
        if parsed.employment_type == tc.expected_emp_type:
            field_correct["emp_type"] += 1
        else:
            case_perfect = False

        # Check duration
        field_counts["duration"] += 1
        if parsed.max_duration_months == tc.expected_duration:
            field_correct["duration"] += 1
        else:
            case_perfect = False

        # Check exp_level
        field_counts["exp_level"] += 1
        if parsed.experience_level == tc.expected_exp_level:
            field_correct["exp_level"] += 1
        else:
            case_perfect = False

        # Check location
        field_counts["location"] += 1
        if tc.expected_location is None and parsed.location is None:
            field_correct["location"] += 1
        elif (
            tc.expected_location
            and parsed.location
            and tc.expected_location.lower() in parsed.location.lower()
        ):
            field_correct["location"] += 1
        else:
            case_perfect = False

        # Check remote
        field_counts["remote"] += 1
        if parsed.remote_type == tc.expected_remote:
            field_correct["remote"] += 1
        else:
            case_perfect = False

        # Check keywords
        field_counts["keywords"] += 1
        if tc.keyword_substr and parsed.role_keywords:
            if tc.keyword_substr.lower() in parsed.role_keywords.lower():
                field_correct["keywords"] += 1
            else:
                case_perfect = False
        elif tc.keyword_substr is None and parsed.role_keywords is None:
            field_correct["keywords"] += 1
        else:
            case_perfect = False

        if case_perfect:
            exact_matches += 1
            status = "PASS"
        else:
            status = "DIFF"

        print(f"[{i:02d}] [{status}] Query: '{tc.query}'")
        if not case_perfect:
            print(f"     Expected: emp={tc.expected_emp_type}, dur={tc.expected_duration}, exp={tc.expected_exp_level}, loc={tc.expected_location}, rem={tc.expected_remote}, kw~={tc.keyword_substr}")
            print(f"     Received: emp={parsed.employment_type}, dur={parsed.max_duration_months}, exp={parsed.experience_level}, loc={parsed.location}, rem={parsed.remote_type}, kw='{parsed.role_keywords}'")

    print("-" * 80)
    print("Field-Level Accuracy Summary:")
    print("-" * 80)
    for field, total in field_counts.items():
        correct = field_correct[field]
        pct = (correct / total) * 100.0 if total else 0.0
        print(f"  - {field:<12}: {correct:2d}/{total:2d} ({pct:5.1f}%)")

    overall_pct = (exact_matches / len(BENCHMARK_CASES)) * 100.0
    print("-" * 80)
    print(f"Full Exact Match Accuracy: {exact_matches}/{len(BENCHMARK_CASES)} ({overall_pct:.1f}%)")
    print("=" * 80)

    return {
        "total": len(BENCHMARK_CASES),
        "exact_matches": exact_matches,
        "accuracy_pct": overall_pct,
        "field_accuracies": {k: field_correct[k] / field_counts[k] for k in field_counts},
    }


if __name__ == "__main__":
    asyncio.run(evaluate_all())
