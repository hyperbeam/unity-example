using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class WritablePanel : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI text;

    public void SetPrompt(string prompt)
    {
        text.text = prompt;
    }
}
