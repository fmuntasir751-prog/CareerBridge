# CareerBridge Matching Methodology
# CareerBridge マッチング方式

## 1. Formula / 計算式

CareerBridge uses an interpretable weighted score:

`Match = Skills(40) + Title(15) + Location(15) + Workplace(10) + Japanese(10) + Salary(10)`

CareerBridgeは、説明可能な重み付きスコアを使用します。

`マッチ度 = スキル(40) + 希望職種(15) + 勤務地(15) + 勤務形態(10) + 日本語レベル(10) + 給与(10)`

| Factor | Weight | Reason |
| --- | ---: | --- |
| Skills | 40 | Skills are the strongest direct evidence that a student can perform the job. |
| Desired job title | 15 | Career direction matters, but equivalent titles can be expressed differently. |
| Location | 15 | Location strongly affects whether a job is practically reachable. |
| Workplace type | 10 | On-site, remote and hybrid preferences affect suitability. |
| Japanese level | 10 | Meeting the required communication level is important for working in Japan. |
| Salary | 10 | Salary affects preference but should not outweigh capability and role fit. |

### Weight explanation in Japanese

| 評価項目 | 重み | 設定理由 |
| --- | ---: | --- |
| スキル | 40 | 業務を遂行できる能力を最も直接的に示すため |
| 希望職種 | 15 | 学生のキャリア目標との一致を評価するため |
| 勤務地 | 15 | 通勤や転居を含む実用上の適合性が高いため |
| 勤務形態 | 10 | 出社、リモート、ハイブリッドの希望を反映するため |
| 日本語レベル | 10 | 日本で働くために必要なコミュニケーション条件を確認するため |
| 給与 | 10 | 重要な希望条件だが、能力や職種より重くしないため |

The weights are design hypotheses, not universal truth.

The experiment and user evaluation must be used to validate or revise them.

この重みは設計上の仮説であり、普遍的な最適値ではありません。

比較実験と利用者評価の結果に基づいて、今後調整する必要があります。

## 2. Scoring Rules / 判定ルール

- Skill aliases such as `React.js` and `ReactJS` are mapped to one canonical skill.
- Skill score is proportional to the number of matched required skills.
- English and Japanese desired job titles are supported.
- Exact or contained Japanese titles can receive the full title score.
- Location is matched only when both the profile and job contain a non-empty location.
- Japanese levels are ordered as `Not required < N3 < N2 < N1`.
- If a job has no maximum salary, salary compatibility is considered unknown and receives a partial score.
- Every component is returned in `score_breakdown`, making the recommendation explainable.

Japanese:

- `React.js` এবং `ReactJS`-এর মতো একই skill-এর ভিন্ন নামকে একটি canonical skill হিসেবে গণনা করা হয়।
- প্রয়োজনীয় skill-এর কত শতাংশ match করেছে তার ভিত্তিতে skill score হিসাব করা হয়।
- English ও Japanese—দুই ধরনের job title support করা হয়।
- সম্পূর্ণ বা contained Japanese title match করলে পুরো 15 points পাওয়া যায়।
- Student এবং job—দুই জায়গায় location থাকলেই শুধু location comparison করা হয়।
- Japanese level-এর order হলো `Not required < N3 < N2 < N1`।
- Job-এর maximum salary না থাকলে salary compatibility unknown হিসেবে ধরা হয় এবং partial score দেওয়া হয়।
- `score_breakdown`-এ প্রতিটি score আলাদাভাবে return করা হয়।

## 3. Bug Fixes / バグ修正

### Japanese title bug

Previously, the title-matching logic mainly recognized Latin letters and numbers.

As a result, a Japanese desired title such as:

`フロントエンドエンジニア`

could incorrectly receive zero points.

The updated implementation recognizes:

- Kanji
- Hiragana
- Katakana
- English letters
- Numbers and technical symbols

### Empty-location bug

Previously, an empty location could incorrectly match another location because an empty string is considered part of every string in Python.

The updated logic first checks:

```python
if not normalized_profile or not normalized_job:
    return False
  4. Comparison with Previous Research
先行研究との比較
Approach	Main characteristic	Difference from CareerBridge
Collaborative filtering	Learns from many users' clicks and applications	CareerBridge works for new users without interaction history.
Semantic embedding models	Capture synonyms and contextual similarity	CareerBridge is simpler and more transparent but weaker for unseen synonyms.
ESCO or taxonomy knowledge graphs	Standardize multilingual skills and occupations	CareerBridge uses a smaller curated alias dictionary and has a lower setup cost.
LLM-based recommendation	Can generate and explain recommendations	CareerBridge ranks verified jobs using deterministic scoring. Gemini is used for career advice, not as the ranking authority.


Research Position
CareerBridge is not intended to compete with large-scale commercial recommendation systems trained on millions of user interactions.

Its goal is to build a practical bilingual prototype for international students.

Students can inspect:
- Matching skills
- Missing skills
- Job-title compatibility
- Location compatibility
- Workplace preference
- Japanese-language requirement
- Salary compatibility
This makes the recommendation easier to understand and explain.
5. Relevant Research / 参考文献
1. Zhang, M., van der Goot, R., and Plank, B. (2023).
   ESCOXLM-R: Multilingual Taxonomy-driven Pre-training for the Job Market Domain.
   ACL.
   https://aclanthology.org/2023.acl-long.662/
2. Kavas, H., Serra-Vidal, M., and Wanner, L. (2025).
   Multilingual Skill Extraction for Job Vacancy-Job Seeker Matching in Knowledge Graphs.
   https://aclanthology.org/2025.genaik-1.15/
3. Zheng, Z. et al. (2023).
   Generative Job Recommendations with Large Language Model.
   https://arxiv.org/abs/2307.02157
6. Controlled Experiment / 比較実験
Run the following command from the repository root:
python .\research\run_matching_experiment.py

The script applies two matching methods to exactly the same student profile and job cases:
1. Skills-only matching
2. CareerBridge weighted matching
The script creates:
- matching_experiment_results.csv
- matching_experiment_summary.json
- matching_comparison.svg
Pilot Results
Metric	Skills-only	Weighted matching
Mean Absolute Error	28.67	8.83
Pairwise Ranking Accuracy	46.67%	86.67%


Lower MAE is better.

Higher ranking accuracy is better.

The results indicate that the weighted method handles deliberately mismatched jobs more appropriately than the skills-only method.
7. Research Integrity Notice
The supplied job cases are controlled synthetic pilot data.

They are used to test known edge cases.

They must not be presented as results collected from real students.

実験データは、境界条件を確認するための合成パイロットデータです。

実際の利用者から収集した結果ではありません。
8. Limitations / 制限
- The skill dictionary covers only a limited set of technical skills.
- The weights were manually designed and require validation with users.
- Location matching does not calculate commuting time or distance.
- Japanese title matching cannot understand every possible synonym.
- Work-experience duration is not currently used.
- Education level is not currently used.
- Visa or residence status is not currently used.
- Company culture is not currently evaluated.
- The experiment uses a small synthetic dataset.
- A high matching score must not be used as an automatic hiring or rejection decision.
9. Future Improvements / 今後の改善
- Integrate ESCO or another standardized skill taxonomy.
- Investigate multilingual semantic embeddings.
- Conduct sensitivity analysis for the six weights.
- Add distance or travel-time evaluation.
- Collect user-evaluation responses from international students.
- Compare participant-selected jobs with the system ranking.
- Expand the experiment with real and anonymized job data.  