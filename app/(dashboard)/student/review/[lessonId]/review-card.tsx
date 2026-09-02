'use client';

import { useState } from 'react';

import { submitReview } from '../actions';

const ratingLabels = ['Again', 'Hard', 'Good', 'Easy'] as const;

export function ReviewCard({
  lessonId,
  progressId,
  frontText,
  backText,
  exampleSentence,
}: {
  lessonId: string;
  progressId: string;
  frontText: string;
  backText: string;
  exampleSentence: string | null;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      <div className="border rounded-2xl p-8 text-center min-h-56 flex flex-col justify-center">
        <p className="text-2xl font-semibold">{frontText}</p>

        {revealed ? (
          <div className="mt-6">
            <hr className="mb-6" />
            <p className="text-lg">{backText}</p>
            {exampleSentence && (
              <p className="text-sm text-muted-foreground mt-3">{exampleSentence}</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-8 mx-auto border rounded-lg px-4 py-2"
          >
            Hiện đáp án
          </button>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {([1, 2, 3, 4] as const).map((rating, index) => (
            <form key={rating} action={submitReview.bind(null, lessonId, progressId, rating)}>
              <button className="w-full border rounded py-2">{ratingLabels[index]}</button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}
